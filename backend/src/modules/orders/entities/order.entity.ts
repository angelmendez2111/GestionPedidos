import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { ColumnDecimalTransformer } from '../../../common/utils/decimal.transformer';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'P-000001' })
  @Column({ name: 'order_number', type: 'nvarchar', length: 20, unique: true })
  orderNumber: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'customer_id', type: 'int' })
  customerId: number;

  @ApiProperty({ type: () => Customer })
  @ManyToOne(() => Customer, (customer) => customer.orders, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDIENTE })
  @Column({ type: 'varchar', length: 20, default: OrderStatus.PENDIENTE })
  status: OrderStatus;

  @ApiProperty({ example: 10.0, description: 'Porcentaje de descuento aplicado (0-100)' })
  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  discountPercentage: number;

  @ApiProperty({ example: 2750.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  subtotal: number;

  @ApiProperty({ example: 275.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  discount: number;

  @ApiProperty({ example: 2475.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: new ColumnDecimalTransformer(),
  })
  total: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt: Date;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, {
    eager: true,
  })
  items: OrderItem[];
}
