import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsUpdate } from './markets.update';
import { MarketsScene } from './markets.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [MarketsService, MarketsUpdate, MarketsScene],
    exports: [MarketsService],
})
export class MarketsModule { }