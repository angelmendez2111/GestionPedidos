import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ColumnDecimalTransformer } from '../../../common/utils/decimal.transformer';
import { Product } from '../../products/entities/product.entity';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
@Unique('UQ_order_items_order_product', ['orderId', 'productId'])
export class OrderItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'order_id', type: 'int' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @ApiProperty({ example: 1 })
  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, (product) => product.orderItems, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({
    example: 50.0,
    description: 'Precio unitario histórico congelado al agregar el ítem',
  })
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  unitPrice: number;

  @ApiProperty({ example: 100.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  subtotal: number;
}
