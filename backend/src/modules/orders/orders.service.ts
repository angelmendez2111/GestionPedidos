import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { roundMoney } from '../../common/utils/money.util';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStateMachine } from './domain/order-state-machine';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CreateOrderDto, CreateOrderItemInputDto } from './dto/create-order.dto';
import { UpdateOrderDiscountDto } from './dto/update-order-discount.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['customer', 'items', 'items.product'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, manager?: EntityManager): Promise<Order> {
    const repo = manager ? manager.getRepository(Order) : this.orderRepo;
    const order = await repo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado.`);
    }
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const customer = await manager.findOne(Customer, {
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Cliente con ID ${dto.customerId} no encontrado.`,
        );
      }
      if (customer.status !== EntityStatus.ACTIVO) {
        throw new BadRequestException(
          `El cliente "${customer.name}" está INACTIVO y no puede registrar pedidos.`,
        );
      }

      const consolidatedItems = this.consolidateItems(dto.items ?? []);
      const preparedItems: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      if (consolidatedItems.length > 0) {
        const productIds = consolidatedItems.map((i) => i.productId);
        const products = await manager.find(Product, {
          where: { id: In(productIds) },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const item of consolidatedItems) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new NotFoundException(
              `Producto con ID ${item.productId} no encontrado.`,
            );
          }
          if (product.status !== EntityStatus.ACTIVO) {
            throw new BadRequestException(
              `El producto "${product.name}" está INACTIVO.`,
            );
          }
          if (item.quantity > product.stock) {
            throw new BadRequestException(
              `Stock insuficiente para "${product.name}" (Disponible: ${product.stock}, Solicitado: ${item.quantity}).`,
            );
          }

          const unitPrice = roundMoney(product.price);
          const subtotal = roundMoney(unitPrice * item.quantity);
          preparedItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
            subtotal,
          });
        }
      }

      const discountPercentage = roundMoney(dto.discountPercentage ?? 0);
      const totals = this.calculateTotals(preparedItems, discountPercentage);

      // Insertar con número temporal único y asignar formato secuencial P-000001 usando el ID generado
      const order = manager.create(Order, {
        orderNumber: `TMP-${randomUUID().slice(0, 12)}`,
        customerId: customer.id,
        status: OrderStatus.PENDIENTE,
        discountPercentage,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
      });

      const savedOrder = await manager.save(Order, order);
      savedOrder.orderNumber = `P-${String(savedOrder.id).padStart(6, '0')}`;
      await manager.update(Order, savedOrder.id, {
        orderNumber: savedOrder.orderNumber,
      });

      if (preparedItems.length > 0) {
        const itemEntities = preparedItems.map((item) =>
          manager.create(OrderItem, {
            orderId: savedOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          }),
        );
        await manager.save(OrderItem, itemEntities);
      }

      return this.findOne(savedOrder.id, manager);
    });
  }

  async addItem(orderId: number, dto: AddOrderItemDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertEditable(order.status);

      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${dto.productId} no encontrado.`,
        );
      }
      if (product.status !== EntityStatus.ACTIVO) {
        throw new BadRequestException(
          `El producto "${product.name}" está INACTIVO.`,
        );
      }

      const existingItem = await manager.findOne(OrderItem, {
        where: { orderId, productId: dto.productId },
        loadEagerRelations: false,
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + dto.quantity;
        if (newQuantity > product.stock) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}" (Disponible: ${product.stock}, Total solicitado: ${newQuantity}).`,
          );
        }
        existingItem.quantity = newQuantity;
        existingItem.subtotal = roundMoney(existingItem.unitPrice * newQuantity);
        await manager.save(OrderItem, existingItem);
      } else {
        if (dto.quantity > product.stock) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}" (Disponible: ${product.stock}, Solicitado: ${dto.quantity}).`,
          );
        }
        const unitPrice = roundMoney(product.price);
        const newItem = manager.create(OrderItem, {
          orderId,
          productId: product.id,
          quantity: dto.quantity,
          unitPrice,
          subtotal: roundMoney(unitPrice * dto.quantity),
        });
        await manager.save(OrderItem, newItem);
      }

      await this.recalculateAndPersistTotals(order, manager);
      return this.findOne(orderId, manager);
    });
  }

  async updateItemQuantity(
    orderId: number,
    itemId: number,
    dto: UpdateOrderItemDto,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertEditable(order.status);

      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
        loadEagerRelations: false,
      });
      if (!item) {
        throw new NotFoundException(
          `Ítem ${itemId} no encontrado en el pedido ${orderId}.`,
        );
      }

      const product = await manager.findOne(Product, {
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${item.productId} no encontrado.`,
        );
      }
      if (product.status !== EntityStatus.ACTIVO) {
        throw new BadRequestException(
          `El producto "${product.name}" está INACTIVO.`,
        );
      }
      if (dto.quantity > product.stock) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}" (Disponible: ${product.stock}, Solicitado: ${dto.quantity}).`,
        );
      }

      item.quantity = dto.quantity;
      item.subtotal = roundMoney(item.unitPrice * dto.quantity);
      await manager.save(OrderItem, item);

      await this.recalculateAndPersistTotals(order, manager);
      return this.findOne(orderId, manager);
    });
  }

  async removeItem(orderId: number, itemId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertEditable(order.status);

      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
        loadEagerRelations: false,
      });
      if (!item) {
        throw new NotFoundException(
          `Ítem ${itemId} no encontrado en el pedido ${orderId}.`,
        );
      }

      await manager.remove(OrderItem, item);
      await this.recalculateAndPersistTotals(order, manager);
      return this.findOne(orderId, manager);
    });
  }

  async updateDiscount(
    orderId: number,
    dto: UpdateOrderDiscountDto,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertEditable(order.status);

      order.discountPercentage = roundMoney(dto.discountPercentage);
      await this.recalculateAndPersistTotals(order, manager);
      return this.findOne(orderId, manager);
    });
  }

  /**
   * Confirma un pedido verificando existencia, estado, vigencia y stock bajo bloqueo pesimista
   * para garantizar consistencia ante concurrencia.
   */
  async confirm(orderId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar que el pedido exista (con bloqueo de escritura sobre el pedido)
      const order = await this.lockOrderOrFail(orderId, manager);

      // 2. Verificar transición de estado válida
      OrderStateMachine.assertCanTransition(order.status, OrderStatus.CONFIRMADO);

      const customer = await manager.findOne(Customer, {
        where: { id: order.customerId },
      });
      if (!customer || customer.status !== EntityStatus.ACTIVO) {
        throw new BadRequestException(
          'El cliente del pedido está inactivo o no existe.',
        );
      }

      const items = await manager.find(OrderItem, {
        where: { orderId },
        loadEagerRelations: false,
      });
      if (items.length === 0) {
        throw new BadRequestException(
          'No se puede confirmar un pedido sin productos.',
        );
      }

      // 3. Bloquear productos en orden ascendente de ID para prevenir deadlocks
      const productIds = Array.from(new Set(items.map((i) => i.productId))).sort(
        (a, b) => a - b,
      );
      const lockedProducts = await manager
        .createQueryBuilder(Product, 'product')
        .setLock('pessimistic_write')
        .where('product.id IN (:...productIds)', { productIds })
        .orderBy('product.id', 'ASC')
        .getMany();

      const productMap = new Map(lockedProducts.map((p) => [p.id, p]));

      // 4. Re-verificar productos activos y stock disponible
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Producto con ID ${item.productId} no encontrado.`,
          );
        }
        if (product.status !== EntityStatus.ACTIVO) {
          throw new BadRequestException(
            `El producto "${product.name}" está INACTIVO y no puede confirmarse.`,
          );
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}" al confirmar (Disponible: ${product.stock}, Solicitado: ${item.quantity}).`,
          );
        }
      }

      // 5. Descontar stock
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        product.stock -= item.quantity;
      }
      await manager.save(Product, Array.from(productMap.values()));

      // 6 y 7. Cambiar estado a CONFIRMADO y guardar
      await manager.update(Order, order.id, {
        status: OrderStatus.CONFIRMADO,
      });

      return this.findOne(orderId, manager);
    });
  }

  /**
   * Cancela un pedido PENDIENTE o CONFIRMADO.
   * Decisión de diseño: si el pedido ya estaba CONFIRMADO, la cancelación devuelve el stock
   * de manera atómica dentro de la misma transacción.
   */
  async cancel(orderId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertCanTransition(order.status, OrderStatus.CANCELADO);

      if (order.status === OrderStatus.CONFIRMADO) {
        const items = await manager.find(OrderItem, {
          where: { orderId },
          loadEagerRelations: false,
        });

        if (items.length > 0) {
          const productIds = Array.from(
            new Set(items.map((i) => i.productId)),
          ).sort((a, b) => a - b);

          const lockedProducts = await manager
            .createQueryBuilder(Product, 'product')
            .setLock('pessimistic_write')
            .where('product.id IN (:...productIds)', { productIds })
            .orderBy('product.id', 'ASC')
            .getMany();

          const productMap = new Map(lockedProducts.map((p) => [p.id, p]));
          for (const item of items) {
            const product = productMap.get(item.productId);
            if (product) {
              product.stock += item.quantity;
            }
          }
          await manager.save(Product, Array.from(productMap.values()));
        }
      }

      await manager.update(Order, order.id, {
        status: OrderStatus.CANCELADO,
      });

      return this.findOne(orderId, manager);
    });
  }

  async complete(orderId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.lockOrderOrFail(orderId, manager);
      OrderStateMachine.assertCanTransition(order.status, OrderStatus.COMPLETADO);

      await manager.update(Order, order.id, {
        status: OrderStatus.COMPLETADO,
      });

      return this.findOne(orderId, manager);
    });
  }

  private async lockOrderOrFail(
    orderId: number,
    manager: EntityManager,
  ): Promise<Order> {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
      loadEagerRelations: false,
    });
    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
    }
    return order;
  }

  private async recalculateAndPersistTotals(
    order: Order,
    manager: EntityManager,
  ): Promise<void> {
    const items = await manager.find(OrderItem, {
      where: { orderId: order.id },
      loadEagerRelations: false,
    });

    const totals = this.calculateTotals(items, order.discountPercentage);
    await manager.update(Order, order.id, {
      discountPercentage: order.discountPercentage,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
    });
  }

  private calculateTotals(
    items: Array<{ subtotal: number }>,
    discountPercentage: number,
  ): { subtotal: number; discount: number; total: number } {
    const subtotal = roundMoney(
      items.reduce((acc, item) => acc + Number(item.subtotal), 0),
    );
    const discount = roundMoney(subtotal * (Number(discountPercentage) / 100));
    const total = roundMoney(Math.max(0, subtotal - discount));
    return { subtotal, discount, total };
  }

  private consolidateItems(
    items: CreateOrderItemInputDto[],
  ): CreateOrderItemInputDto[] {
    const merged = new Map<number, number>();
    for (const item of items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
    return Array.from(merged.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }
}
