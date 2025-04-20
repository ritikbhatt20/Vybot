import { Module } from '@nestjs/common';
import { VybeApiService } from './vybe-api.service';
import { KeyboardsService } from './keyboard.service';

@Module({
    providers: [VybeApiService, KeyboardsService],
    exports: [VybeApiService, KeyboardsService],
})
export class SharedModule {}