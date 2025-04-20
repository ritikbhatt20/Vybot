import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { KeyboardsService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { commandDescriptions } from './constants';
import { escapeMarkdownV2 } from './utils';
import { KNOWN_ACCOUNTS_SCENE_ID } from './modules/known-accounts/known-accounts.scene';

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

    // Add these handlers for the filter again and close buttons from the known accounts scene
    @Action('FILTER_AGAIN')
    async handleFilterAgain(@Ctx() ctx: Context & SceneContext) {
        await ctx.answerCbQuery('🔄 Preparing to filter again...');
        // Re-enter the scene to start fresh
        await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
    }

    @Action('CLOSE_BUTTON')
    async handleCloseButton(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();
    }

    @Action('CANCEL_BUTTON')
    async handleCancelButton(@Ctx() ctx: Context & SceneContext) {
        await ctx.answerCbQuery('Operation cancelled');
        // Make sure we leave the scene BEFORE sending any additional messages
        if (ctx.scene && ctx.scene.current) {
            await ctx.scene.leave();
        }
        const cancelMessage = escapeMarkdownV2('❌ Operation cancelled.');
        await ctx.replyWithMarkdownV2(cancelMessage, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }
}