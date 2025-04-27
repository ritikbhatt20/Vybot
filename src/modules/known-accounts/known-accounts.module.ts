import { Module } from '@nestjs/common';
import { KnownAccountsService } from './known-accounts.service';
import { KnownAccountsUpdate } from './known-accounts.update';
import { KnownAccountsScene } from './known-accounts.scene';
import { TokenBalancesScene } from './token-balances.scene';
import { TokenBalancesTsScene } from './token-balances-ts.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        KnownAccountsService,
        KnownAccountsUpdate,
        KnownAccountsScene,
        TokenBalancesScene,
        TokenBalancesTsScene,
    ],
    exports: [KnownAccountsService],
})
export class KnownAccountsModule { }
