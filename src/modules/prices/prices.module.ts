import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesUpdate } from './prices.update';
import { PythAccountsScene } from './pyth-accounts.scene';
import { PythPriceScene } from './pyth-price.scene';
import { PythPriceTsScene } from './pyth-price-ts.scene';
import { PythPriceOhlcScene } from './pyth-price-olhc.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        PricesService,
        PricesUpdate,
        PythAccountsScene,
        PythPriceScene,
        PythPriceTsScene,
        PythPriceOhlcScene,
    ],
    exports: [PricesService],
})
export class PricesModule { }