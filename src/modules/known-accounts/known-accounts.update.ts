import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Actions } from 'src/enums/actions.enum';
import { Commands } from 'src/enums/commands.enum';
import { KNOWN_ACCOUNTS_SCENE_ID } from './known-accounts.scene';

@Update()
export class KnownAccountsUpdate {
    @Action(Actions.KNOWN_ACCOUNTS)
    async onKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        ctx.answerCbQuery(' Fetching known accounts...');
        await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
    }

    @Command(Commands.KnownAccounts)
    async handleKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        const [message] = await Promise.allSettled([
            ctx.reply('🔃 Fetching known accounts...'),
            ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID),
        ]);
        if (message.status === 'fulfilled') {
            await ctx.deleteMessage(message.value.message_id);
        }
    }
}
