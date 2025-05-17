import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from '@telegraf/types';
import { Actions, SceneActions } from '../../enums/actions.enum';

interface InlineKeyboardButton {
    text: string;
    callback_data: string;
}

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
                Markup.button.callback('📈 Prices', Actions.PRICES_MENU),
                Markup.button.callback('📊 Markets', Actions.MARKETS_MENU),
            ],
            [
                Markup.button.callback('🔔 Alerts', Actions.ALERTS_MENU),
                Markup.button.callback('📈 Patterns', Actions.PATTERNS_MENU),
            ],
            [
                Markup.button.url('🌐 Vybe Network', 'https://www.vybenetwork.com'),
                Markup.button.url('📃 Vybe Documentation', 'docs.vybenetwork.com/docs'),
            ],
            [
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
                Markup.button.callback('📊 Token OHLCV', Actions.TOKEN_OHLCV),
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

    getPricesKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('💰 Token Prices', Actions.TOKEN_PRICE),
            ],
            [
                Markup.button.callback('📈 Pyth Accounts', Actions.PYTH_ACCOUNTS),
                Markup.button.callback('📊 Pyth Price OHLC', Actions.PYTH_PRICE_OHLC),
            ],
            [
                Markup.button.callback('💸 Pyth Price', Actions.PYTH_PRICE),
                Markup.button.callback('📈 Pyth Price TS', Actions.PYTH_PRICE_TS),
            ],
            [
                Markup.button.callback('📋 Pyth Product', Actions.PYTH_PRODUCT),
                Markup.button.callback('🛠️ DEX & AMM', Actions.DEX_AMM),
            ],
            [
                Markup.button.callback('🏠 Back to Main Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getMarketsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📊 Markets', Actions.MARKETS)],
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
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
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
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
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
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
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
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
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
                Markup.button.url('📊 More Analytics', 'https://docs.vybenetwork.com'),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokensResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Tokens Again', SceneActions.TOKENS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
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
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenHoldersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Top Holders Again', SceneActions.TOKEN_HOLDERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenDetailsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Details Again', SceneActions.TOKEN_DETAILS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenVolumeResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Volume Again', SceneActions.TOKEN_VOLUME_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenHoldersTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Holders Trends Again', SceneActions.TOKEN_HOLDERS_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenTransfersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Transfers Again', SceneActions.TOKEN_TRANSFERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenTradesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Trades Again', SceneActions.TOKEN_TRADES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Programs Again', SceneActions.PROGRAMS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramTxCountResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Tx Count Again', SceneActions.PROGRAM_TX_COUNT_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramIxCountResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Ix Count Again', SceneActions.PROGRAM_IX_COUNT_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Active Users TS Again', SceneActions.PROGRAM_ACTIVE_USERS_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramActiveUsersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Active Users Again', SceneActions.PROGRAM_ACTIVE_USERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getProgramDetailsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Program Details Again', SceneActions.PROGRAM_DETAILS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPythAccountsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Pyth Accounts Again', SceneActions.PYTH_ACCOUNTS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPythPriceResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.PYTH_PRICE_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPythPriceTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.PYTH_PRICE_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPythPriceOhlcResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.PYTH_PRICE_OHLC_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenOhlcvResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.TOKEN_OHLCV_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPythProductResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.PYTH_PRODUCT_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getDexAmmResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Fetch Again', SceneActions.DEX_AMM_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getMarketsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.MARKETS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenPriceKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getTokenPriceResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Try Again', SceneActions.TOKEN_PRICE_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getAlertsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
            ],
        ]);
    }

    getAlertsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Alerts Again', SceneActions.ALERTS_AGAIN)],
            [Markup.button.callback('➕ Add New Alert', 'ADD_ALERT')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getPatternsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('👥 Head and Shoulders', Actions.HEAD_AND_SHOULDERS)],
            [Markup.button.callback('🔄 Double Top/Bottom', Actions.DOUBLE_TOP_BOTTOM)],
            [Markup.button.callback('📐 Triangle Patterns', Actions.TRIANGLE_PATTERNS)],
            [Markup.button.callback('🚩 Flags and Pennants', Actions.FLAGS_AND_PENNANTS)],
            [Markup.button.callback('📋 My Pattern Alerts', 'my_pattern_alerts')],
            [Markup.button.callback('🏠 Back to Main Menu', Actions.MAIN_MENU)],
        ]);
    }

    getPatternAlertActionsKeyboard(alertId: string): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🔄 Toggle Active/Inactive', `toggle_pattern_alert:${alertId}`),
                Markup.button.callback('🗑️ Delete', `delete_pattern_alert:${alertId}`)
            ],
            [Markup.button.callback('🔙 Back to Alerts', 'my_pattern_alerts')],
            [Markup.button.callback('🏠 Back to Main Menu', Actions.MAIN_MENU)],
        ]);
    }

    getPatternAlertsListKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('➕ Create New Alert', Actions.PATTERNS_MENU)],
            [Markup.button.callback('🏠 Back to Main Menu', Actions.MAIN_MENU)],
        ]);
    }

    getPatternsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Patterns Again', SceneActions.PATTERNS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://docs.vybenetwork.com')],
            [
                Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    createInlineKeyboard(buttons: InlineKeyboardButton[][]): {
        inline_keyboard: InlineKeyboardButton[][];
    } {
        return {
            inline_keyboard: buttons
        };
    }
}