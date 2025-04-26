// modules/known-accounts/known-accounts.update.ts
import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { KNOWN_ACCOUNTS_SCENE_ID } from './known-accounts.scene';
import { TOKEN_BALANCES_SCENE_ID } from './token-balances.scene';

@Update()
export class KnownAccountsUpdate {
    private readonly logger = new Logger(KnownAccountsUpdate.name);

    @Action(Actions.KNOWN_ACCOUNTS)
    async onKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔍 Accessing known accounts explorer...');
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering known accounts scene: ${error.message}`);
        }
    }

    @Command(Commands.KnownAccounts)
    async handleKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🔍 Opening known accounts explorer...'),
                ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling known accounts command: ${error.message}`);
        }
    }

    @Action(Actions.TOKEN_BALANCES)
    async onTokenBalances(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('💰 Accessing token balances...');
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token balances scene: ${error.message}`);
        }
    }

    @Command(Commands.TokenBalances)
    async handleTokenBalances(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('💰 Opening token balances explorer...'),
                ctx.scene.enter(TOKEN_BALANCES_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling token balances command: ${error.message}`);
        }
    }
}
