import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensUpdate } from './tokens.update';
import { TokensScene } from './tokens.scene';
import { TokenHoldersScene } from './token-holders.scene';
import { TokenDetailsScene } from './token-details.scene';
import { TokenVolumeScene } from './token-volume.scene';
import { TokenHoldersTimeSeriesScene } from './token-holders-ts.scene';
import { TokenTransfersScene } from './token-transfers.scene';
import { TokenTradesScene } from './token-trades.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        TokensService,
        TokensUpdate,
        TokensScene,
        TokenHoldersScene,
        TokenDetailsScene,
        TokenVolumeScene,
        TokenHoldersTimeSeriesScene,
        TokenTransfersScene,
        TokenTradesScene,
    ],
    exports: [TokensService],
})
export class TokensModule { }
