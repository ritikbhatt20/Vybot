import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { BOT_MESSAGES, commandDescriptions } from './constants';
import { KNOWN_ACCOUNTS_SCENE_ID } from './modules/known-accounts/known-accounts.scene';
import { TOKEN_BALANCES_SCENE_ID } from './modules/known-accounts/token-balances.scene';
import { TOKENS_SCENE_ID } from './modules/tokens/tokens.scene';
import { TOKEN_HOLDERS_SCENE_ID } from './modules/tokens/token-holders.scene';

@Update()
export class AppUpdate {
    private readonly logger = new Logger(AppUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        this.logger.log(
            `New user started the bot: ${ctx.from?.id} (${ctx.from?.username || 'no username'})`
        );

        await ctx.replyWithHTML(BOT_MESSAGES.WELCOME, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Help()
    @Action(Actions.HELP)
    async help(@Ctx() ctx: Context) {
        const helpMessage = Object.values(commandDescriptions).join('\n');

        await ctx.replyWithHTML(`${BOT_MESSAGES.HELP_HEADER}${helpMessage}`, {
            reply_markup: this.keyboard.getCloseKeyboard().reply_markup,
        });
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

    @Action('TOKEN_BALANCES_AGAIN')
    async handleTokenBalancesAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token balances query...');
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token balances again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKENS_AGAIN')
    async handleTokensAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing tokens query...');
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in tokens again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_HOLDERS_AGAIN')
    async handleTokenHoldersAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing top token holders query...');
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token holders again action: ${error.message}`);
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

    @Command(Commands.TokenBalances)
    async handleTokenBalances(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token balances scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Tokens)
    async handleTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering tokens scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHolders)
    async handleTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders scene: ${error.message}`);
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
