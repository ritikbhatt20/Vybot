import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from '../shared/keyboard.service';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { MARKETS_SCENE_ID } from './markets.scene';
import { BOT_MESSAGES } from '../../constants';

@Update()
export class MarketsUpdate {
    private readonly logger = new Logger(MarketsUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Action(Actions.MARKETS)
    async onMarkets(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing markets explorer...');
            await ctx.scene.enter(MARKETS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering markets scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Markets)
    async handleMarkets(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📊 Opening markets explorer...'),
                ctx.scene.enter(MARKETS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling markets command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }
}