import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { KeyboardsService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { commandDescriptions } from './constants';
import { escapeMarkdownV2 } from './utils';

@Update()
export class AppUpdate {
    constructor(private readonly keyboard: KeyboardsService) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        const message = escapeMarkdownV2(
            `👋 *Welcome to VybeBot!*\n\n🚀 _Real-time Solana analytics_\n\nUse /knownaccounts to explore labeled accounts.`,
        );
        await ctx.replyWithMarkdownV2(message, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Help()
    @Action(Actions.HELP)
    async help(@Ctx() ctx: Context) {
        const helpMessage = Object.values(commandDescriptions).join('\n');
        await ctx.replyWithMarkdownV2(
            `*📃 Help*\n\n${escapeMarkdownV2(helpMessage)}`,
            {
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback('❌ Close', Actions.CLOSE),
                ]).reply_markup,
            },
        );
    }

    @Action(Actions.CLOSE)
    async onClose(@Ctx() ctx: Context) {
        await ctx.deleteMessage();
    }

    @Command(Commands.MAIN_MENU)
    async handleMainMenu(@Ctx() ctx: Context) {
        const message = escapeMarkdownV2(
            '👋 *Welcome to VybeBot!*\n\nWhat would you like to explore today?',
        );
        await ctx.replyWithMarkdownV2(message, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Action(Actions.MAIN_MENU)
    async handleMainMenuAction(@Ctx() ctx: Context) {
        ctx.answerCbQuery();
        const message = escapeMarkdownV2(
            '👋 *Welcome to VybeBot!*\n\nWhat would you like to explore today?',
        );
        await ctx.replyWithMarkdownV2(message, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }
}