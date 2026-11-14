import 'dotenv/config';
import AppDataSource from '../../config/typeorm.datasource';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Product } from '../../modules/products/entities/product.entity';

async function runSeed() {
  await AppDataSource.initialize();

  const customerRepo = AppDataSource.getRepository(Customer);
  const productRepo = AppDataSource.getRepository(Product);

  const customersData = [
    {
      name: 'Juan Pérez',
      document: '44556677',
      email: 'juan.perez@example.com',
      status: EntityStatus.ACTIVO,
    },
    {
      name: 'María López',
      document: '77889900',
      email: 'maria.lopez@example.com',
      status: EntityStatus.ACTIVO,
    },
    {
      name: 'Carlos Mendoza (Inactivo)',
      document: '11223344',
      email: 'carlos.mendoza@example.com',
      status: EntityStatus.INACTIVO,
    },
  ];

  for (const data of customersData) {
    const exists = await customerRepo.findOne({
      where: { document: data.document },
    });
    if (!exists) {
      await customerRepo.save(customerRepo.create(data));
    }
  }

  const productsData = [
    {
      code: 'PROD-001',
      name: 'Laptop',
      price: 2500.0,
      stock: 5,
      status: EntityStatus.ACTIVO,
    },
    {
      code: 'PROD-002',
      name: 'Mouse',
      price: 50.0,
      stock: 15,
      status: EntityStatus.ACTIVO,
    },
    {
      code: 'PROD-003',
      name: 'Teclado',
      price: 150.0,
      stock: 8,
      status: EntityStatus.ACTIVO,
    },
    {
      code: 'PROD-004',
      name: 'Monitor 27"',
      price: 950.0,
      stock: 2,
      status: EntityStatus.ACTIVO,
    },
    {
      code: 'PROD-005',
      name: 'Webcam HD (Inactivo)',
      price: 180.0,
      stock: 10,
      status: EntityStatus.INACTIVO,
    },
  ];

  for (const data of productsData) {
    const exists = await productRepo.findOne({
      where: { code: data.code },
    });
    if (!exists) {
      await productRepo.save(productRepo.create(data));
    }
  }

  console.log('Seed completado exitosamente.');
  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Error ejecutando seed:', err);
  process.exit(1);
});
