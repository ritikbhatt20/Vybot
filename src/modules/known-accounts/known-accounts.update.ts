import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { KNOWN_ACCOUNTS_SCENE_ID } from './known-accounts.scene';

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
}
