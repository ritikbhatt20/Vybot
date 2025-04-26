import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensUpdate } from './tokens.update';
import { TokensScene } from './tokens.scene';
import { TokenHoldersScene } from './token-holders.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [TokensService, TokensUpdate, TokensScene, TokenHoldersScene],
    exports: [TokensService],
})
export class TokensModule { }