import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { TOKENS_SCENE_ID } from './tokens.scene';
import { TOKEN_HOLDERS_SCENE_ID } from './token-holders.scene';
import { TOKEN_DETAILS_SCENE_ID } from './token-details.scene';
import { TOKEN_VOLUME_SCENE_ID } from './token-volume.scene';

@Update()
export class TokensUpdate {
    private readonly logger = new Logger(TokensUpdate.name);

    @Action(Actions.TOKENS)
    async onTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔍 Accessing tokens explorer...');
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering tokens scene: ${error.message}`);
        }
    }

    @Command(Commands.Tokens)
    async handleTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🔍 Opening tokens explorer...'),
                ctx.scene.enter(TOKENS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling tokens command: ${error.message}`);
        }
    }

    @Action(Actions.TOKEN_HOLDERS)
    async onTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('👥 Accessing top token holders...');
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders scene: ${error.message}`);
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
        }
    }

    @Action(Actions.TOKEN_DETAILS)
    async onTokenDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📋 Accessing token details...');
            await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token details scene: ${error.message}`);
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
        }
    }

    @Action(Actions.TOKEN_VOLUME)
    async onTokenVolume(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing token volume time series...');
            await ctx.scene.enter(TOKEN_VOLUME_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token volume scene: ${error.message}`);
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
        }
    }
}
