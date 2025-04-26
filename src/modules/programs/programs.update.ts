import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { PROGRAMS_SCENE_ID } from './programs.scene';

@Update()
export class ProgramsUpdate {
    private readonly logger = new Logger(ProgramsUpdate.name);

    @Action(Actions.PROGRAMS)
    async onPrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔍 Accessing programs explorer...');
            await ctx.scene.enter(PROGRAMS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering programs scene: ${error.message}`);
        }
    }

    @Command(Commands.Programs)
    async handlePrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🔍 Opening programs explorer...'),
                ctx.scene.enter(PROGRAMS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling programs command: ${error.message}`);
        }
    }
}