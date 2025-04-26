// modules/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensUpdate } from './tokens.update';
import { TokensScene } from './tokens.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [TokensService, TokensUpdate, TokensScene],
    exports: [TokensService],
})
export class TokensModule { }