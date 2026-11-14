import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('Clientes')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  @ApiResponse({ status: 201, type: Customer })
  @ApiResponse({ status: 409, description: 'Documento o email duplicado' })
  create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes registrados' })
  @ApiQuery({ name: 'status', enum: EntityStatus, required: false })
  @ApiResponse({ status: 200, type: [Customer] })
  findAll(@Query('status') status?: EntityStatus): Promise<Customer[]> {
    return this.customersService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un cliente por ID' })
  @ApiResponse({ status: 200, type: Customer })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos o estado de un cliente' })
  @ApiResponse({ status: 200, type: Customer })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, dto);
  }
}
