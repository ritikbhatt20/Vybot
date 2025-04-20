import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { Actions } from 'src/enums/actions.enum';
import { InlineKeyboardMarkup } from '@telegraf/types';

@Injectable()
export class KeyboardsService {
    getMainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
        return Markup.inlineKeyboard([
            [Markup.button.callback(' Known Accounts', Actions.KNOWN_ACCOUNTS)],
            [Markup.button.callback(' Help', Actions.HELP)],
        ]);
    }
}