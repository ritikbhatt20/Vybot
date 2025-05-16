import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { PatternRecognitionScene } from './pattern-recognition.scene';
import { PatternAlert } from './entities/pattern-alert.entity';
import { IdentifiedPattern } from './entities/identified-pattern.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PatternAlert, IdentifiedPattern]),
        SharedModule,
    ],
    providers: [PatternRecognitionService, PatternRecognitionScene],
    exports: [PatternRecognitionService],
})
export class PatternRecognitionModule {} 