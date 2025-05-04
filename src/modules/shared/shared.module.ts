import { Module } from '@nestjs/common';
import { VybeApiService } from './vybe-api.service';
import { KeyboardService } from './keyboard.service';
import { NlpService } from './nlp.service';

@Module({
    providers: [VybeApiService, KeyboardService, NlpService],
    exports: [VybeApiService, KeyboardService, NlpService],
})
export class SharedModule { }