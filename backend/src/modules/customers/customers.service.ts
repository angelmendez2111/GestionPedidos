import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existingByDoc = await this.customerRepo.findOne({
      where: { document: dto.document.trim() },
    });
    if (existingByDoc) {
      throw new ConflictException(
        `Ya existe un cliente con el documento ${dto.document}.`,
      );
    }

    const existingByEmail = await this.customerRepo.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existingByEmail) {
      throw new ConflictException(
        `Ya existe un cliente con el email ${dto.email}.`,
      );
    }

    const customer = this.customerRepo.create({
      name: dto.name.trim(),
      document: dto.document.trim(),
      email: dto.email.trim().toLowerCase(),
      status: dto.status ?? EntityStatus.ACTIVO,
    });

    return this.customerRepo.save(customer);
  }

  async findAll(status?: EntityStatus): Promise<Customer[]> {
    return this.customerRepo.find({
      where: status ? { status } : {},
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    }
    return customer;
  }

  async findActiveOrFail(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    if (customer.status !== EntityStatus.ACTIVO) {
      throw new BadRequestException(
        `El cliente "${customer.name}" se encuentra INACTIVO y no puede realizar pedidos.`,
      );
    }
    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.document && dto.document.trim() !== customer.document) {
      const duplicateDoc = await this.customerRepo.findOne({
        where: { document: dto.document.trim() },
      });
      if (duplicateDoc) {
        throw new ConflictException(
          `Ya existe otro cliente con el documento ${dto.document}.`,
        );
      }
      customer.document = dto.document.trim();
    }

    if (dto.email && dto.email.trim().toLowerCase() !== customer.email) {
      const duplicateEmail = await this.customerRepo.findOne({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (duplicateEmail) {
        throw new ConflictException(
          `Ya existe otro cliente con el email ${dto.email}.`,
        );
      }
      customer.email = dto.email.trim().toLowerCase();
    }

    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.status !== undefined) customer.status = dto.status;

    return this.customerRepo.save(customer);
  }
}
