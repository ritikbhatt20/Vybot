import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { parse as parseConnectionString } from 'pg-connection-string';
import { AppUpdate } from './app.update';
import { SharedModule } from './modules/shared/shared.module';
import { KnownAccountsModule } from './modules/known-accounts/known-accounts.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { NftModule } from './modules/nft/nft.module';
import { PricesModule } from './modules/prices/prices.module';
import { MarketsModule } from './modules/markets/markets.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { PatternRecognitionModule } from './modules/patterns/pattern-recognition.module';
import { PostgresSessionStore } from './utils/pg-session-store';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenPriceAlert } from './modules/alerts/token-price-alert.entity';
import { PatternAlert, IdentifiedPattern } from './modules/patterns/entities/pattern-alert.entity';
import { AddPatternRecognitionTables1684218200000 } from './migrations/1684218200000-AddPatternRecognitionTables';
import { AddUserIdToPatternAlerts1684218201000 } from './migrations/1684218201000-AddUserIdToPatternAlerts';
import { CreatePatternAlertsTable1684218202000 } from './migrations/1684218202000-CreatePatternAlertsTable';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL') || '';
        const dbConfig = parseConnectionString(connectionString);

        if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
          throw new Error('Unable to parse database connection string');
        }

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port ? Number(dbConfig.port) : 5432,
          username: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [TokenPriceAlert, PatternAlert, IdentifiedPattern],
          migrations: [
            AddPatternRecognitionTables1684218200000,
            AddUserIdToPatternAlerts1684218201000,
            CreatePatternAlertsTable1684218202000
          ],
          migrationsRun: true,
          synchronize: false, // Disable auto-sync since we're using migrations
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false
            }
          }
        };
      },
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL') || '';
        const dbConfig = parseConnectionString(connectionString);

        if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
          throw new Error('Unable to parse database connection string');
        }

        const store = PostgresSessionStore({
          host: dbConfig.host,
          port: dbConfig.port ? Number(dbConfig.port) : 5432,
          database: dbConfig.database,
          user: dbConfig.user,
          password: dbConfig.password,
          ssl: true,
        });

        const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (!botToken) {
          throw new Error('Telegram bot token is required. Please check your .env file.');
        }

        return {
          token: botToken,
          middlewares: [session({ store })],
          botName: 'VybeBot',
        };
      },
    }),
    SharedModule,
    KnownAccountsModule,
    TokensModule,
    ProgramsModule,
    NftModule,
    PricesModule,
    MarketsModule,
    AlertsModule,
    PatternRecognitionModule,
  ],
  providers: [AppUpdate],
})
export class AppModule { }
