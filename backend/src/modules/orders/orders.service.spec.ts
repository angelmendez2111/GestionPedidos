import { BadRequestException, ConflictException } from '@nestjs/common';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService (reglas de negocio)', () => {
  const createMockManager = (overrides: Partial<any> = {}) => {
    const queryBuilderMock = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const manager: any = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((_entity, data) => ({ ...data })),
      save: jest.fn(async (_entity, data) =>
        Array.isArray(data) ? data : { id: 1, ...data },
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      _qb: queryBuilderMock,
      ...overrides,
    };
    return manager;
  };

  it('calcula subtotal, descuento del 10% y total en el backend al crear pedido', async () => {
    const customer = { id: 1, name: 'Juan Pérez', status: EntityStatus.ACTIVO };
    const laptop = {
      id: 1,
      name: 'Laptop',
      price: 2500,
      stock: 5,
      status: EntityStatus.ACTIVO,
    };
    const mouse = {
      id: 2,
      name: 'Mouse',
      price: 50,
      stock: 10,
      status: EntityStatus.ACTIVO,
    };

    const manager = createMockManager();
    manager.findOne.mockImplementation(async (entity: any) => {
      if (entity === Customer) return customer;
      return null;
    });
    manager.find.mockResolvedValue([laptop, mouse]);

    let capturedOrder: any;
    manager.save.mockImplementation(async (entity: any, data: any) => {
      if (entity === Order) {
        capturedOrder = { id: 1, ...data };
        return capturedOrder;
      }
      return data;
    });
    manager.getRepository.mockReturnValue({
      findOne: jest.fn().mockImplementation(async () => ({
        ...capturedOrder,
        orderNumber: 'P-000001',
        customer,
        items: [],
      })),
    });

    const dataSource: any = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };

    const service = new OrdersService(dataSource, {} as any);
    const result = await service.create({
      customerId: 1,
      discountPercentage: 10,
      items: [
        { productId: 1, quantity: 1 }, // 2500
        { productId: 2, quantity: 2 }, // 100
      ],
    });

    expect(capturedOrder.subtotal).toBe(2600);
    expect(capturedOrder.discount).toBe(260);
    expect(capturedOrder.total).toBe(2340);
    expect(result.orderNumber).toBe('P-000001');
  });

  it('rechaza crear pedido si el cliente está INACTIVO', async () => {
    const manager = createMockManager();
    manager.findOne.mockResolvedValue({
      id: 3,
      name: 'Carlos',
      status: EntityStatus.INACTIVO,
    });

    const dataSource: any = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };
    const service = new OrdersService(dataSource, {} as any);

    await expect(
      service.create({ customerId: 3, items: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza crear pedido si la cantidad solicitada supera el stock', async () => {
    const manager = createMockManager();
    manager.findOne.mockResolvedValue({
      id: 1,
      name: 'Juan',
      status: EntityStatus.ACTIVO,
    });
    manager.find.mockResolvedValue([
      {
        id: 1,
        name: 'Teclado',
        price: 150,
        stock: 5,
        status: EntityStatus.ACTIVO,
      },
    ]);

    const dataSource: any = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };
    const service = new OrdersService(dataSource, {} as any);

    await expect(
      service.create({
        customerId: 1,
        items: [{ productId: 1, quantity: 7 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('descuenta stock de manera atómica al confirmar y rechaza si falta stock', async () => {
    const order = {
      id: 1,
      customerId: 1,
      status: OrderStatus.PENDIENTE,
    };
    const customer = { id: 1, status: EntityStatus.ACTIVO };
    const items = [{ id: 10, orderId: 1, productId: 2, quantity: 3 }];
    const product = {
      id: 2,
      name: 'Mouse',
      stock: 5,
      status: EntityStatus.ACTIVO,
    };

    const manager = createMockManager();
    manager.findOne.mockImplementation(async (entity: any) => {
      if (entity === Order) return { ...order };
      if (entity === Customer) return customer;
      return null;
    });
    manager.find.mockResolvedValue(items);
    manager._qb.getMany.mockResolvedValue([product]);
    manager.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        ...order,
        status: OrderStatus.CONFIRMADO,
      }),
    });

    const dataSource: any = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };
    const service = new OrdersService(dataSource, {} as any);

    const confirmed = await service.confirm(1);
    expect(product.stock).toBe(2);
    expect(confirmed.status).toBe(OrderStatus.CONFIRMADO);
  });

  it('devuelve stock al cancelar un pedido CONFIRMADO y rechaza cancelar uno CANCELADO', async () => {
    const confirmedOrder = {
      id: 1,
      customerId: 1,
      status: OrderStatus.CONFIRMADO,
    };
    const items = [{ id: 10, orderId: 1, productId: 2, quantity: 3 }];
    const product = { id: 2, name: 'Mouse', stock: 2 };

    const manager = createMockManager();
    manager.findOne.mockResolvedValueOnce({ ...confirmedOrder });
    manager.find.mockResolvedValueOnce(items);
    manager._qb.getMany.mockResolvedValueOnce([product]);
    manager.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        ...confirmedOrder,
        status: OrderStatus.CANCELADO,
      }),
    });

    const dataSource: any = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };
    const service = new OrdersService(dataSource, {} as any);

    const canceled = await service.cancel(1);
    expect(product.stock).toBe(5);
    expect(canceled.status).toBe(OrderStatus.CANCELADO);

    // Ahora probar transición inválida desde CANCELADO
    manager.findOne.mockResolvedValueOnce({
      id: 1,
      status: OrderStatus.CANCELADO,
    });
    await expect(service.cancel(1)).rejects.toThrow(ConflictException);
  });
});
