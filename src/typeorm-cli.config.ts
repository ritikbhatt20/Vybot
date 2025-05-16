import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { TokenPriceAlert } from './modules/alerts/token-price-alert.entity';
import { PatternAlert } from './modules/patterns/entities/pattern-alert.entity';
import { IdentifiedPattern } from './modules/patterns/entities/identified-pattern.entity';
import { UpdateBasePriceColumn1684218000000 } from './migrations/1684218000000-UpdateBasePriceColumn';
import { MakeTargetPriceNullable1684218100000 } from './migrations/1684218100000-MakeTargetPriceNullable';
import { AddPatternRecognitionTables1684218200000 } from './migrations/1684218200000-AddPatternRecognitionTables';
import { parse as parseConnectionString } from 'pg-connection-string';

config();

const configService = new ConfigService();
const connectionString = configService.get<string>('DATABASE_URL') || '';
const dbConfig = parseConnectionString(connectionString);

if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
    throw new Error('Unable to parse database connection string');
}

export default new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port ? Number(dbConfig.port) : 5432,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [TokenPriceAlert, PatternAlert, IdentifiedPattern],
    migrations: [
        UpdateBasePriceColumn1684218000000,
        MakeTargetPriceNullable1684218100000,
        AddPatternRecognitionTables1684218200000
    ],
    ssl: true,
    extra: {
        ssl: {
            rejectUnauthorized: false
        }
    }
}); 