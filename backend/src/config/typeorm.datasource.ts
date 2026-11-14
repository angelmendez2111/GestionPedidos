import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseConfig } from './database.config';

const AppDataSource = new DataSource(buildDatabaseConfig());

export default AppDataSource;
