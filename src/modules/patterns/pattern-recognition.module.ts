import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatternRecognitionScene } from './pattern-recognition.scene';
import { PatternAlertsScene } from './pattern-alerts.scene';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { PatternAlert, IdentifiedPattern } from './entities/pattern-alert.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PatternAlert, IdentifiedPattern]),
        SharedModule,
    ],
    providers: [
        PatternRecognitionScene,
        PatternAlertsScene,
        PatternRecognitionService,
    ],
    exports: [PatternRecognitionService],
})
export class PatternRecognitionModule {} 