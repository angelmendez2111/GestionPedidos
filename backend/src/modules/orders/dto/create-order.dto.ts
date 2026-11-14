import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemInputDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'productId debe ser un entero' })
  @Min(1)
  productId: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'quantity debe ser un entero positivo' })
  @Min(1, { message: 'La cantidad mínima por producto es 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'customerId debe ser un entero' })
  @Min(1)
  customerId: number;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
    maximum: 100,
    description: 'Porcentaje de descuento simple aplicado al subtotal',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El descuento no puede ser menor a 0%' })
  @Max(100, { message: 'El descuento no puede ser mayor a 100%' })
  discountPercentage?: number;

  @ApiPropertyOptional({ type: [CreateOrderItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInputDto)
  items?: CreateOrderItemInputDto[];
}
