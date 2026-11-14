import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { roundMoney } from '../../common/utils/money.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.productRepo.findOne({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con el código ${normalizedCode}.`,
      );
    }

    const product = this.productRepo.create({
      code: normalizedCode,
      name: dto.name.trim(),
      price: roundMoney(dto.price),
      stock: dto.stock,
      status: dto.status ?? EntityStatus.ACTIVO,
    });

    return this.productRepo.save(product);
  }

  async findAll(status?: EntityStatus): Promise<Product[]> {
    return this.productRepo.find({
      where: status ? { status } : {},
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async findActiveOrFail(id: number): Promise<Product> {
    const product = await this.findOne(id);
    if (product.status !== EntityStatus.ACTIVO) {
      throw new BadRequestException(
        `El producto "${product.name}" se encuentra INACTIVO.`,
      );
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      if (normalizedCode !== product.code) {
        const duplicate = await this.productRepo.findOne({
          where: { code: normalizedCode },
        });
        if (duplicate) {
          throw new ConflictException(
            `Ya existe otro producto con el código ${normalizedCode}.`,
          );
        }
        product.code = normalizedCode;
      }
    }

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.price !== undefined) product.price = roundMoney(dto.price);
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.status !== undefined) product.status = dto.status;

    return this.productRepo.save(product);
  }
}
