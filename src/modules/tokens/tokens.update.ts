import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { TOKENS_SCENE_ID } from './tokens.scene';
import { TOKEN_HOLDERS_SCENE_ID } from './token-holders.scene';

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
}
