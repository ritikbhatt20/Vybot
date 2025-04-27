import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftUpdate } from './nft.update';
import { NftCollectionOwnersScene } from './nft-collection-owners.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        NftService,
        NftUpdate,
        NftCollectionOwnersScene,
    ],
    exports: [NftService],
})
export class NftModule { }