import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsUpdate } from './alerts.update';
import { AlertsScene } from './alerts.scene';
import { TokenPriceAlert } from './token-price-alert.entity';
import { SharedModule } from '../shared/shared.module';
import { PricesModule } from '../prices/prices.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        TypeOrmModule.forFeature([TokenPriceAlert]),
        ScheduleModule.forRoot(), // For cron jobs
        SharedModule,
        PricesModule,
    ],
    providers: [AlertsService, AlertsUpdate, AlertsScene],
    exports: [AlertsService],
})
export class AlertsModule { }