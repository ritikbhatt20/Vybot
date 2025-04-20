import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { parse as parseConnectionString } from 'pg-connection-string';
import { AppUpdate } from './app.update';
import { SharedModule } from './modules/shared/shared.module';
import { KnownAccountsModule } from './modules/known-accounts/known-accounts.module';
import { PostgresSessionStore } from './utils/pg-session-store';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL') || '';
        const dbConfig = parseConnectionString(connectionString);

        if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
          throw new Error('Unable to parse database connection string');
        }

        // Create PostgreSQL session store
        const store = PostgresSessionStore({
          host: dbConfig.host,
          port: dbConfig.port ? Number(dbConfig.port) : 5432,
          database: dbConfig.database,
          user: dbConfig.user,
          password: dbConfig.password,
          ssl: true, // Adjust for Neon
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
  ],
  providers: [AppUpdate],
})
export class AppModule { }