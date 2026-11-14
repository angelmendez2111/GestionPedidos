import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @IsNotEmpty({ message: 'El código del producto es obligatorio' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 2500.0, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio debe ser numérico con máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @ApiPropertyOptional({ enum: EntityStatus, default: EntityStatus.ACTIVO })
  @IsOptional()
  @IsEnum(EntityStatus, { message: 'Estado debe ser ACTIVO o INACTIVO' })
  status?: EntityStatus;
}
