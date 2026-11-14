import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';

/**
 * Construye las opciones de conexión de TypeORM para SQL Server leyendo variables de entorno.
 */
export function buildDatabaseConfig(): DataSourceOptions {
  const host = process.env.DB_HOST || 'localhost';
  const portEnv = process.env.DB_PORT?.trim();
  const instanceName = process.env.DB_INSTANCE?.trim();
  const username = process.env.DB_USERNAME || 'sa';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'GestionPedidos';
  const encrypt = process.env.DB_ENCRYPT === 'true';
  const trustServerCertificate =
    process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false';

  const usePort = portEnv && !Number.isNaN(Number(portEnv));

  const baseOptions: DataSourceOptions = {
    type: 'mssql',
    host,
    username,
    password,
    database,
    entities: [Customer, Product, Order, OrderItem],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    options: {
      encrypt,
      trustServerCertificate,
      ...(!usePort && instanceName ? { instanceName } : {}),
    },
  };

  if (usePort) {
    return {
      ...baseOptions,
      port: Number(portEnv),
    };
  }

  if (instanceName) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    port: 1433,
  };
}
