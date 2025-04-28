import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesUpdate } from './prices.update';
import { PythAccountsScene } from './pyth-accounts.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        PricesService,
        PricesUpdate,
        PythAccountsScene,
    ],
    exports: [PricesService],
})
export class PricesModule { }