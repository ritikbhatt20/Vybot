import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Initializing VybeBot server...');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security & optimization middleware
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  app.use(helmet());
  // app.use(compression());
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`✅ VybeBot server started on port ${port}`);
}

bootstrap().catch(err => {
  new Logger('Bootstrap').error(`❌ Failed to start VybeBot server: ${err.message}`);
});
