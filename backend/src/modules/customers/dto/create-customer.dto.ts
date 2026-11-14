import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '44556677' })
  @IsString()
  @IsNotEmpty({ message: 'El documento es obligatorio' })
  @MaxLength(30)
  document: string;

  @ApiProperty({ example: 'juan.perez@empresa.com' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({ enum: EntityStatus, default: EntityStatus.ACTIVO })
  @IsOptional()
  @IsEnum(EntityStatus, { message: 'Estado debe ser ACTIVO o INACTIVO' })
  status?: EntityStatus;
}
