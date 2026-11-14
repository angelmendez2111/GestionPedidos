import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { ColumnDecimalTransformer } from '../../../common/utils/decimal.transformer';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'PROD-001' })
  @Column({ type: 'nvarchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ example: 'Laptop Pro 14"' })
  @Column({ type: 'nvarchar', length: 150 })
  name: string;

  @ApiProperty({ example: 2500.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnDecimalTransformer(),
  })
  price: number;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @ApiProperty({ enum: EntityStatus, example: EntityStatus.ACTIVO })
  @Column({ type: 'varchar', length: 20, default: EntityStatus.ACTIVO })
  status: EntityStatus;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems?: OrderItem[];
}
