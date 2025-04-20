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
        // Parse connection parameters from Neon connection string
        const connectionString = configService.get<string>('DATABASE_URL') || '';

        // Extract connection details from the connection string
        const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/([^?]+)/;
        const match = connectionString.match(regex);

        let dbUser, dbPassword, dbHost, dbPort, dbName;

        if (match) {
          [, dbUser, dbPassword, dbHost, dbPort, dbName] = match;
        } else {
          // For Neon's format which may not include port or have a different format
          const neonRegex = /postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/;
          const neonMatch = connectionString.match(neonRegex);

          if (neonMatch) {
            [, dbUser, dbPassword, dbHost, dbName] = neonMatch;
            // Neon typically uses standard PostgreSQL port
            dbPort = '5432';
          } else {
            throw new Error('Unable to parse database connection string');
          }
        }

        // Create PostgreSQL session store with individual parameters
        const store = PostgresSessionStore({
          host: dbHost,
          port: parseInt(dbPort || '5432'),
          database: dbName,
          user: dbUser,
          password: dbPassword,
          ssl: true
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
