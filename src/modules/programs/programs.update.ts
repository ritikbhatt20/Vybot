import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { PROGRAMS_SCENE_ID } from './programs.scene';
import { PROGRAM_TX_COUNT_SCENE_ID } from './program-tx-count.scene';
import { PROGRAM_IX_COUNT_SCENE_ID } from './program-ix-count.scene';

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

    @Action(Actions.PROGRAM_TX_COUNT)
    async onProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing transaction count time series...');
            await ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program tx count scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramTxCount)
    async handleProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening transaction count time series explorer...'),
                ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program tx count command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_IX_COUNT)
    async onProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing instruction count time series...');
            await ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ix count scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramIxCount)
    async handleProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening instruction count time series explorer...'),
                ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program ix count command: ${error.message}`);
        }
    }
}
