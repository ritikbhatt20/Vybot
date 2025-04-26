// modules/shared/keyboard.service.ts
import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from '@telegraf/types';
import { Actions, SceneActions } from '../../enums/actions.enum';

@Injectable()
export class KeyboardService {
    getMainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🏷️ Known Accounts', Actions.KNOWN_ACCOUNTS)],
            [Markup.button.callback('💰 Token Balances', Actions.TOKEN_BALANCES)],
            [Markup.button.callback('📚 Help', Actions.HELP)],
            [Markup.button.url('🌐 Visit Vybe Network', 'https://www.vybenetwork.com')],
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

    getKnownAccountsResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Again', SceneActions.FILTER_AGAIN)],
            [Markup.button.callback('🔄 Check Token Balances', SceneActions.TOKEN_BALANCES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }

    getTokenBalancesResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Check Token Balances Again', SceneActions.TOKEN_BALANCES_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }
}
