import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from '../shared/keyboard.service';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { TOKENS_SCENE_ID } from './tokens.scene';
import { TOKEN_HOLDERS_SCENE_ID } from './token-holders.scene';
import { TOKEN_DETAILS_SCENE_ID } from './token-details.scene';
import { TOKEN_VOLUME_SCENE_ID } from './token-volume.scene';
import { TOKEN_HOLDERS_TS_SCENE_ID } from './token-holders-ts.scene';
import { TOKEN_TRANSFERS_SCENE_ID } from './token-transfers.scene';
import { TOKEN_TRADES_SCENE_ID } from './token-trades.scene';
import { TOKEN_OHLCV_SCENE_ID } from './token-ohlcv.scene';
import { BOT_MESSAGES } from '../../constants';

@Update()
export class TokensUpdate {
    private readonly logger = new Logger(TokensUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Action(Actions.TOKENS_MENU)
    async onTokensMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing tokens explorer...');
            await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error accessing tokens menu: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKENS)
    async onTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing tokens explorer...');
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering tokens scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Tokens)
    async handleTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📊 Opening tokens explorer...'),
                ctx.scene.enter(TOKENS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling tokens command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_HOLDERS)
    async onTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('👥 Accessing top token holders...');
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHolders)
    async handleTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('👥 Opening top token holders explorer...'),
                ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token holders command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_DETAILS)
    async onTokenDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📋 Accessing token details...');
            await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token details scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenDetails)
    async handleTokenDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📋 Opening token details explorer...'),
                ctx.scene.enter(TOKEN_DETAILS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token details command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_VOLUME)
    async onTokenVolume(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing token volume time series...');
            await ctx.scene.enter(TOKEN_VOLUME_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token volume scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenVolume)
    async handleTokenVolume(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening token volume time series explorer...'),
                ctx.scene.enter(TOKEN_VOLUME_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token volume command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_HOLDERS_TS)
    async onTokenHoldersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing token holders time series...');
            await ctx.scene.enter(TOKEN_HOLDERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders ts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHoldersTs)
    async handleTokenHoldersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📊 Opening token holders time series explorer...'),
                ctx.scene.enter(TOKEN_HOLDERS_TS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token holders ts command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_TRANSFERS)
    async onTokenTransfers(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('💸 Accessing token transfers...');
            await ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token transfers scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTransfers)
    async handleTokenTransfers(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('💸 Opening token transfers explorer...'),
                ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token transfers command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_TRADES)
    async onTokenTrades(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing token trades...');
            await ctx.scene.enter(TOKEN_TRADES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token trades scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTrades)
    async handleTokenTrades(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📊 Opening token trades explorer...'),
                ctx.scene.enter(TOKEN_TRADES_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token trades command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.TOKEN_OHLCV)
    async onTokenOhlcv(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing token OHLCV explorer...');
            await ctx.scene.enter(TOKEN_OHLCV_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token OHLCV scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenOhlcv)
    async handleTokenOhlcv(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📊 Opening token OHLCV explorer...'),
                ctx.scene.enter(TOKEN_OHLCV_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token OHLCV command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }
}