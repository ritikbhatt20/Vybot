import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from '../shared/keyboard.service';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { PYTH_ACCOUNTS_SCENE_ID } from './pyth-accounts.scene';
import { PYTH_PRICE_SCENE_ID } from './pyth-price.scene';
import { BOT_MESSAGES } from '../../constants';

@Update()
export class PricesUpdate {
    private readonly logger = new Logger(PricesUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Action(Actions.PRICES)
    async onPrices(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing prices explorer...');
            await ctx.reply('📈 Prices Menu', {
                reply_markup: this.keyboard.getPricesKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error accessing prices menu: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.PYTH_ACCOUNTS)
    async onPythAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing Pyth accounts explorer...');
            await ctx.scene.enter(PYTH_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering Pyth accounts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.PythAccounts)
    async handlePythAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening Pyth accounts explorer...'),
                ctx.scene.enter(PYTH_ACCOUNTS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling Pyth accounts command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.PYTH_PRICE)
    async onPythPrice(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('💸 Accessing Pyth price explorer...');
            await ctx.scene.enter(PYTH_PRICE_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering Pyth price scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.PythPrice)
    async handlePythPrice(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('💸 Opening Pyth price explorer...'),
                ctx.scene.enter(PYTH_PRICE_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling Pyth price command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }
}
