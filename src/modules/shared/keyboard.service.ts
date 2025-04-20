import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from '@telegraf/types';
import { Actions, SceneActions } from '../../enums/actions.enum';

@Injectable()
export class KeyboardService {
    // Main menu keyboard with attractive icons
    getMainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🏷️ Known Accounts', Actions.KNOWN_ACCOUNTS)],
            [Markup.button.callback('📊 Analytics Dashboard', 'ANALYTICS')],
            [Markup.button.callback('📚 Help', Actions.HELP)],
            [Markup.button.url('🌐 Visit Vybe Network', 'https://www.vybenetwork.com')],
        ]);
    }

    // Simple close button keyboard
    getCloseKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
        ]);
    }

    // Filter options keyboard for known accounts
    getFilterKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📥 Fetch All', SceneActions.FETCH_ALL)],
            [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
        ]);
    }

    // Results action keyboard
    getResultsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Filter Again', SceneActions.FILTER_AGAIN)],
            [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
            [Markup.button.callback('❌ Close', SceneActions.CLOSE_BUTTON)],
        ]);
    }
}