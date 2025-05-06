import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesUpdate } from './prices.update';
import { PythAccountsScene } from './pyth-accounts.scene';
import { PythPriceScene } from './pyth-price.scene';
import { PythPriceTsScene } from './pyth-price-ts.scene';
import { PythPriceOhlcScene } from './pyth-price-olhc.scene';
import { PythProductScene } from './pyth-product.scene';
import { DexAmmScene } from './dex-amm.scene';
import { TokenPriceScene } from './token-price.scene';
import { SharedModule } from '../shared/shared.module';
import { TokensModule } from '../tokens/tokens.module';

@Module({
    imports: [SharedModule, TokensModule],
    providers: [
        PricesService,
        PricesUpdate,
        PythAccountsScene,
        PythPriceScene,
        PythPriceTsScene,
        PythPriceOhlcScene,
        PythProductScene,
        DexAmmScene,
        TokenPriceScene,
    ],
    exports: [PricesService],
})
export class PricesModule { }