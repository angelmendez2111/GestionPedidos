import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDiscountDto } from './dto/update-order-discount.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@ApiTags('Pedidos')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo pedido en estado PENDIENTE',
    description:
      'Calcula subtotales, descuento y total en el backend. Valida cliente activo, productos activos y stock disponible.',
  })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({
    status: 400,
    description: 'Cliente/producto inactivo o stock insuficiente',
  })
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los pedidos' })
  @ApiResponse({ status: 200, type: [Order] })
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un pedido' })
  @ApiResponse({ status: 200, type: Order })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post(':id/items')
  @ApiOperation({
    summary: 'Agregar un producto a un pedido PENDIENTE',
    description:
      'Conserva el precio vigente del producto al momento de la operación y recalcula totales en el backend.',
  })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({ status: 409, description: 'El pedido ya no es editable' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddOrderItemDto,
  ): Promise<Order> {
    return this.ordersService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Modificar la cantidad de un ítem en un pedido PENDIENTE' })
  @ApiResponse({ status: 200, type: Order })
  updateItemQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateOrderItemDto,
  ): Promise<Order> {
    return this.ordersService.updateItemQuantity(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Eliminar un ítem de un pedido PENDIENTE' })
  @ApiResponse({ status: 200, type: Order })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<Order> {
    return this.ordersService.removeItem(id, itemId);
  }

  @Patch(':id/discount')
  @ApiOperation({
    summary: 'Actualizar porcentaje de descuento simple en un pedido PENDIENTE',
  })
  @ApiResponse({ status: 200, type: Order })
  updateDiscount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDiscountDto,
  ): Promise<Order> {
    return this.ordersService.updateDiscount(id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirmar pedido (PENDIENTE -> CONFIRMADO)',
    description:
      'Re-verifica stock dentro de una transacción con bloqueo pesimista y descuenta el inventario de forma atómica.',
  })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente, pedido vacío o entidad inactiva',
  })
  @ApiResponse({ status: 409, description: 'Transición de estado inválida' })
  confirm(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.confirm(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar pedido (PENDIENTE/CONFIRMADO -> CANCELADO)',
    description:
      'Si el pedido estaba CONFIRMADO, devuelve automáticamente el stock reservado en una transacción atómica.',
  })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({ status: 409, description: 'Transición de estado inválida' })
  cancel(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.cancel(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar pedido (CONFIRMADO -> COMPLETADO)' })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({ status: 409, description: 'Transición de estado inválida' })
  complete(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.complete(id);
  }
}
