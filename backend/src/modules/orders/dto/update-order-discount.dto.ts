import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateOrderDiscountDto {
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El descuento no puede ser menor a 0%' })
  @Max(100, { message: 'El descuento no puede ser mayor a 100%' })
  discountPercentage: number;
}
