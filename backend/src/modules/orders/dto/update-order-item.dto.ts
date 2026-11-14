import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity debe ser un entero positivo' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;
}
