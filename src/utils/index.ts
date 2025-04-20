import { Actions } from 'src/enums/actions.enum';
import { Markup } from 'telegraf';

export function escapeMarkdownV2(text: string): string {
    if (typeof text !== 'string') {
        return text;
    }
    const specialCharsRegex = /([_*\[\]()~`>#\+\-=|{}.!])/g;
    return text.replace(specialCharsRegex, '\\$1');
}

interface ErrorButton {
    text: string;
    action: string;
}

interface ErrorResponseOptions {
    error: any;
    defaultMessage: string;
    ctx: any;
    buttons?: ErrorButton[];
    prefix?: string;
}

export async function handleErrorResponses({
    error,
    defaultMessage,
    ctx,
    buttons = [],
    prefix = '🛑',
}: ErrorResponseOptions) {
    const errorMessage = error?.response?.data?.message || defaultMessage;
    let finalButtons = [...buttons];
    if (!ctx.scene?.current) {
        finalButtons.push({ text: '❌ Close', action: Actions.CLOSE });
    }
    if (ctx.scene?.current) {
        finalButtons.push({ text: '🚫 Cancel', action: Actions.CANCEL });
    }
    const keyboard = finalButtons.map((btn) => [
        Markup.button.callback(btn.text, btn.action),
    ]);
    await ctx.replyWithMarkdownV2(`${prefix} ${escapeMarkdownV2(errorMessage)}`, {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
    });
}