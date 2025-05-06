import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { PythPriceOhlc, PythPriceError } from '../../types';
import { Markup } from 'telegraf';

export const PYTH_PRICE_OHLC_SCENE_ID = 'PYTH_PRICE_OHLC_SCENE';

interface PythPriceOhlcWizardState {
    priceFeedId?: string;
    timeStart?: number;
    timeEnd?: number;
    resolution?: string;
}

@Wizard(PYTH_PRICE_OHLC_SCENE_ID)
export class PythPriceOhlcScene {
    private readonly logger = new Logger(PythPriceOhlcScene.name);
    private readonly validResolutions = ['1h', '1d', '1w', '1m', '1y'];

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askPriceFeedId(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_PRICE_FEED_ID, {
                reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask price feed ID step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.priceFeedId = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_START_TIME, {
                reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const timeStart = parseInt(messageText, 10);
            if (isNaN(timeStart) || timeStart < 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeStart = timeStart;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_END_TIME, {
                reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const timeEnd = parseInt(messageText, 10);
            if (isNaN(timeEnd) || timeEnd < 0 || (ctx.wizard.state.timeStart && timeEnd <= ctx.wizard.state.timeStart)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeEnd = timeEnd;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_RESOLUTION, {
                reply_markup: Markup.inlineKeyboard([
                    [
                        Markup.button.callback('Hourly', '1h'),
                        Markup.button.callback('Daily', '1d'),
                        Markup.button.callback('Weekly', '1w'),
                    ],
                    [
                        Markup.button.callback('Monthly', '1m'),
                        Markup.button.callback('Yearly', '1y'),
                    ],
                    [
                        Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        Markup.button.callback('❌ Cancel', SceneActions.CANCEL_BUTTON),
                    ],
                ]).reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask resolution step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(5)
    async handleOhlcQuery(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            let resolution: string;
            if (ctx.updateType === 'callback_query') {
                resolution = (ctx.callbackQuery as any).data;
                if (!this.validResolutions.includes(resolution)) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                    );
                    return;
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text?.toLowerCase();
                const foundResolution = this.validResolutions.find(r => r === messageText || ['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(messageText));
                if (!foundResolution) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                    );
                    return;
                }
                resolution = foundResolution === 'hourly' ? '1h' : foundResolution === 'daily' ? '1d' : foundResolution === 'weekly' ? '1w' : foundResolution === 'monthly' ? '1m' : '1y';
                if (!resolution) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                    );
                    return;
                }
                resolution = resolution === 'hourly' ? '1h' : resolution === 'daily' ? '1d' : resolution === 'weekly' ? '1w' : resolution === 'monthly' ? '1m' : '1y';
            }

            ctx.wizard.state.resolution = resolution;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.SEARCHING);

            const { priceFeedId, timeStart, timeEnd, resolution: res } = ctx.wizard.state;
            const response = await this.pricesService.getPythPriceOhlc(priceFeedId!, {
                resolution: res,
                timeStart,
                timeEnd,
                limit: 5, // Limit to 5 for display
            });

            if ('code' in response && 'message' in response) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const ohlcData = response as PythPriceOhlc[];
            if (!ohlcData || ohlcData.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = ohlcData
                .slice(0, 5)
                .map((data, i) => (
                    `<b>${i + 1}. Time: ${new Date(data.timeBucketStart * 1000).toUTCString()}</b>\n` +
                    `📈 <b>Open:</b> ${data.open}\n` +
                    `⬆️ <b>High:</b> ${data.high}\n` +
                    `⬇️ <b>Low:</b> ${data.low}\n` +
                    `📉 <b>Close:</b> ${data.close}\n` +
                    `📊 <b>Average Price:</b> ${data.avgPrice}\n` +
                    `🔍 <b>Average Confidence:</b> ${data.avgConf}\n`
                ))
                .join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle OHLC query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_PRICE_OHLC_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.PYTH_PRICE_OHLC_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askPriceFeedId(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceOhlcWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in cancel command: ${error.message}`);
            await ctx.scene.leave();
        }
    }
}