import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from '@telegraf/types';
import { Actions, SceneActions } from '../../enums/actions.enum';

@Injectable()
export class KeyboardService {
    getMainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('👤 Accounts', Actions.ACCOUNTS_MENU),
                Markup.button.callback('🎨 NFTs', Actions.NFTS_MENU),
            ],
            [
                Markup.button.callback('📊 Tokens', Actions.TOKENS_MENU),
                Markup.button.callback('🛠️ Programs', Actions.PROGRAMS_MENU),
            ],
            [
                Markup.button.url('🌐 Vybe Network', 'https://www.vybenetwork.com'),
                Markup.button.url('📃 Vybe Documentation', 'docs.vybenetwork.com/docs'),
            ],
            [
                Markup.button.url('💬 Support', 'https://t.me/VybeNetwork_Official'),
                Markup.button.callback('❓ Help', Actions.HELP),
            ],
        ]);
    }

    getAccountsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('👤 Known Accounts', Actions.KNOWN_ACCOUNTS),
                Markup.button.callback('💰 Token Balances', Actions.TOKEN_BALANCES),
            ],
            [
                Markup.button.callback('📈 Token Balances TS', Actions.TOKEN_BALANCES_TS),
                Markup.button.callback('📊 Wallet PnL', Actions.WALLET_PNL),
            ],
            [
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getNftsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🎨 NFT Owners', Actions.NFT_OWNERS),
            ],
            [
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokensKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('📊 All Tokens', Actions.TOKENS),
            ],
            [
                Markup.button.callback('📋 Token Details', Actions.TOKEN_DETAILS),
                Markup.button.callback('👥 Top Holders', Actions.TOKEN_HOLDERS),
            ],
            [
                Markup.button.callback('📈 Volume Trends', Actions.TOKEN_VOLUME),
                Markup.button.callback('📊 Holders Trends', Actions.TOKEN_HOLDERS_TS),
            ],
            [
                Markup.button.callback('💸 Transfers', Actions.TOKEN_TRANSFERS),
                Markup.button.callback('📊 Trades', Actions.TOKEN_TRADES),
            ],
            [
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🛠️ All Programs', Actions.PROGRAMS),
            ],
            [
                Markup.button.callback('📋 Program Details', Actions.PROGRAM_DETAILS),
                Markup.button.callback('🏆 Program Ranking', Actions.PROGRAM_RANKING),
            ],
            [
                Markup.button.callback('📈 Program Tx Count', Actions.PROGRAM_TX_COUNT),
                Markup.button.callback('📈 Program Ix Count', Actions.PROGRAM_IX_COUNT),
            ],
            [
                Markup.button.callback('📈 Program Active Users TS', Actions.PROGRAM_ACTIVE_USERS_TS),
                Markup.button.callback('📈 Program Active Users', Actions.PROGRAM_ACTIVE_USERS),
            ],
            [
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getCloseKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
            [Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON)],
        ]);
    }

    getFilterKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📥 Fetch All', SceneActions.FETCH_ALL)],
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenBalancesKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenBalancesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Balances Again', SceneActions.TOKEN_BALANCES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenBalancesTsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenBalancesTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Balances TS Again', SceneActions.TOKEN_BALANCES_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getWalletPnlKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getWalletPnlResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Wallet PnL Again', SceneActions.WALLET_PNL_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getNftCollectionOwnersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getNftCollectionOwnersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check NFT Owners Again', SceneActions.NFT_OWNERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getKnownAccountsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🔄 Filter Again', SceneActions.FILTER_AGAIN),
                Markup.button.callback('💰 Check Token Balances', SceneActions.TOKEN_BALANCES_AGAIN),
            ],
            [
                Markup.button.url('📊 More Analytics', 'https://alphavybe.com'),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokensResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Tokens Again', SceneActions.TOKENS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenHoldersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenDetailsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenVolumeKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenHoldersTsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenTransfersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenTradesKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramTxCountKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramIxCountKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersTsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramDetailsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramRankingKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('Default (10)', 'limit:10'),
                Markup.button.callback('5', 'limit:5'),
                Markup.button.callback('20', 'limit:20'),
            ],
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getProgramRankingResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Rankings Again', SceneActions.PROGRAM_RANKING_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenHoldersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Top Holders Again', SceneActions.TOKEN_HOLDERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenDetailsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Details Again', SceneActions.TOKEN_DETAILS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenVolumeResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Volume Again', SceneActions.TOKEN_VOLUME_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenHoldersTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Holders Trends Again', SceneActions.TOKEN_HOLDERS_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenTransfersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Transfers Again', SceneActions.TOKEN_TRANSFERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenTradesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Trades Again', SceneActions.TOKEN_TRADES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Programs Again', SceneActions.PROGRAMS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramTxCountResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Tx Count Again', SceneActions.PROGRAM_TX_COUNT_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramIxCountResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Ix Count Again', SceneActions.PROGRAM_IX_COUNT_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Active Users TS Again', SceneActions.PROGRAM_ACTIVE_USERS_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Active Users Again', SceneActions.PROGRAM_ACTIVE_USERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramDetailsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Program Details Again', SceneActions.PROGRAM_DETAILS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }
}
