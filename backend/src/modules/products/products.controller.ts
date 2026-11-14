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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo producto' })
  @ApiResponse({ status: 201, type: Product })
  @ApiResponse({ status: 409, description: 'Código de producto duplicado' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos y su stock disponible' })
  @ApiQuery({ name: 'status', enum: EntityStatus, required: false })
  @ApiResponse({ status: 200, type: [Product] })
  findAll(@Query('status') status?: EntityStatus): Promise<Product[]> {
    return this.productsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un producto por ID' })
  @ApiResponse({ status: 200, type: Product })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar precio, stock o estado de un producto',
    description:
      'Los cambios de precio no afectan los pedidos ya existentes (regla de precio histórico).',
  })
  @ApiResponse({ status: 200, type: Product })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }
}
