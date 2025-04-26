import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from '@telegraf/types';
import { Actions, SceneActions } from '../../enums/actions.enum';

@Injectable()
export class KeyboardService {
    getMainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            // Group analytics features together
            [
                Markup.button.callback('👤 Known Accounts', Actions.KNOWN_ACCOUNTS),
                Markup.button.url('🌐 Vybe Network', 'https://www.vybenetwork.com'),
            ],
            // Token-related features
            [
                Markup.button.callback('💰 Token Balances', Actions.TOKEN_BALANCES),
                Markup.button.callback('📊 Tokens', Actions.TOKENS),
            ],
            [
                Markup.button.callback('👥 Top Holders', Actions.TOKEN_HOLDERS),
                Markup.button.callback('📋 Token Details', Actions.TOKEN_DETAILS),
            ],
            [
                Markup.button.callback('📈 Volume Trends', Actions.TOKEN_VOLUME),
                Markup.button.callback('📊 Holders Trends', Actions.TOKEN_HOLDERS_TS),
            ],
            [
                Markup.button.callback('💸 Transfers', Actions.TOKEN_TRANSFERS),
                Markup.button.callback('📊 Trades', Actions.TOKEN_TRADES),
            ],
            // Programs and support
            [
                Markup.button.callback('🛠️ Programs', Actions.PROGRAMS),
                Markup.button.callback('❓ Help', Actions.HELP),
            ],
        ]);
    }

    getCloseKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
        ]);
    }

    getFilterKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📥 Fetch All', SceneActions.FETCH_ALL)],
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenBalancesKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokensKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📥 Fetch All', SceneActions.FETCH_ALL)],
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenHoldersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenDetailsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenVolumeKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenHoldersTsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenTransfersKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getTokenTradesKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    getProgramsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📥 Fetch All', SceneActions.FETCH_ALL)],
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
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
                Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON),
            ],
        ]);
    }

    getTokenBalancesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Balances Again', SceneActions.TOKEN_BALANCES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokensResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Tokens Again', SceneActions.TOKENS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenHoldersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Top Holders Again', SceneActions.TOKEN_HOLDERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenDetailsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Details Again', SceneActions.TOKEN_DETAILS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenVolumeResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Volume Again', SceneActions.TOKEN_VOLUME_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenHoldersTsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Holders Trends Again', SceneActions.TOKEN_HOLDERS_TS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenTransfersResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Transfers Again', SceneActions.TOKEN_TRANSFERS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenTradesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Trades Again', SceneActions.TOKEN_TRADES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getProgramsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Programs Again', SceneActions.PROGRAMS_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }
}
