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
import { Order } from '../../orders/entities/order.entity';

@Entity({ name: 'customers' })
export class Customer {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Juan Pérez' })
  @Column({ type: 'nvarchar', length: 150 })
  name: string;

  @ApiProperty({ example: '12345678' })
  @Column({ type: 'nvarchar', length: 30, unique: true })
  document: string;

  @ApiProperty({ example: 'juan.perez@empresa.com' })
  @Column({ type: 'nvarchar', length: 150, unique: true })
  email: string;

  @ApiProperty({ enum: EntityStatus, example: EntityStatus.ACTIVO })
  @Column({ type: 'varchar', length: 20, default: EntityStatus.ACTIVO })
  status: EntityStatus;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders?: Order[];
}
