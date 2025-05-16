import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { parse as parseConnectionString } from 'pg-connection-string';
import { TokenPriceAlert } from './modules/alerts/token-price-alert.entity';
import { PatternAlert, IdentifiedPattern } from './modules/patterns/entities/pattern-alert.entity';
import { AddPatternRecognitionTables1684218200000 } from './migrations/1684218200000-AddPatternRecognitionTables';

config(); // Load .env file

const connectionString = process.env.DATABASE_URL || '';
const dbConfig = parseConnectionString(connectionString);

if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
  throw new Error('Unable to parse database connection string');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port ? Number(dbConfig.port) : 5432,
  username: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [TokenPriceAlert, PatternAlert, IdentifiedPattern],
  migrations: [AddPatternRecognitionTables1684218200000],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
}); 