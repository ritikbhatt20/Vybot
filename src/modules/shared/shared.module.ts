import { Module } from '@nestjs/common';
import { VybeApiService } from './vybe-api.service';
import { KeyboardService } from './keyboard.service';

@Module({
    providers: [VybeApiService, KeyboardService],
    exports: [VybeApiService, KeyboardService],
})
export class SharedModule { }