import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { BOT_MESSAGES, commandDescriptions } from './constants';
import { KNOWN_ACCOUNTS_SCENE_ID } from './modules/known-accounts/known-accounts.scene';

@Update()
export class AppUpdate {
    private readonly logger = new Logger(AppUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        this.logger.log(`New user started the bot: ${ctx.from?.id} (${ctx.from?.username || 'no username'})`);

        await ctx.replyWithHTML(BOT_MESSAGES.WELCOME, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Help()
    @Action(Actions.HELP)
    async help(@Ctx() ctx: Context) {
        const helpMessage = Object.values(commandDescriptions).join('\n');

        await ctx.replyWithHTML(
            `${BOT_MESSAGES.HELP_HEADER}${helpMessage}`,
            {
                reply_markup: this.keyboard.getCloseKeyboard().reply_markup,
            },
        );
    }

    @Action(Actions.CLOSE)
    async onClose(@Ctx() ctx: Context) {
        try {
            await ctx.answerCbQuery();
            await ctx.deleteMessage();
        } catch (error) {
            this.logger.error(`Error in close action: ${error.message}`);
        }
    }

    @Command(Commands.MAIN_MENU)
    async handleMainMenu(@Ctx() ctx: Context) {
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Action(Actions.MAIN_MENU)
    async handleMainMenuAction(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    // Global action handlers for scene buttons
    @Action('FILTER_AGAIN')
    async handleFilterAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing filter options...');
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in filter again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.KnownAccounts)
    async handleKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering known accounts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('CLOSE_BUTTON')
    async handleCloseButton(@Ctx() ctx: Context) {
        try {
            await ctx.answerCbQuery();
            await ctx.deleteMessage();
        } catch (error) {
            this.logger.error(`Error in close button action: ${error.message}`);
        }
    }

    @Action('CANCEL_BUTTON')
    async handleCancelButton(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('Operation cancelled');

            // First leave the scene to prevent any further processing
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }

            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in cancel button action: ${error.message}`);
        }
    }
}
