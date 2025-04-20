import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
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
        // Get database config with fallbacks for required fields
        const dbHost = configService.get<string>('DATABASE_HOST') || 'localhost';
        const dbPort = configService.get<number>('DATABASE_PORT') || 5432;
        const dbName = configService.get<string>('DATABASE_NAME');
        const dbUser = configService.get<string>('DATABASE_USER');
        const dbPassword = configService.get<string>('DATABASE_PASSWORD');

        // Validate required database configuration
        if (!dbName || !dbUser || !dbPassword) {
          throw new Error('Missing required database configuration. Please check your .env file.');
        }

        // Create PostgreSQL session store
        const store = PostgresSessionStore({
          host: dbHost,
          port: dbPort,
          database: dbName,
          user: dbUser,
          password: dbPassword,
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
