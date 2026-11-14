import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddOrderItemDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt({ message: 'productId debe ser un entero' })
  @Min(1)
  productId: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity debe ser un entero positivo' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;
}
