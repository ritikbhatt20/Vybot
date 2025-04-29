import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { TokenOhlcv } from '../../types';
import { Markup } from 'telegraf';

export const TOKEN_OHLCV_SCENE_ID = 'TOKEN_OHLCV_SCENE';

interface TokenOhlcvWizardState {
    mintAddress?: string;
    timeStart?: number;
    timeEnd?: number;
    resolution?: string;
}

@Wizard(TOKEN_OHLCV_SCENE_ID)
export class TokenOhlcvScene {
    private readonly logger = new Logger(TokenOhlcvScene.name);
    private readonly validResolutions = ['1s', '1m', '3m', '5m', '15m', '30m', '1h', '2h', '3h', '4h', '1d', '1w', '1mo', '1y'];

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_MINT_ADDRESS, {
                reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.mintAddress = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_START_TIME, {
                reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const timeStart = parseInt(messageText, 10);
            if (isNaN(timeStart) || timeStart < 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeStart = timeStart;

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_END_TIME, {
                reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const timeEnd = parseInt(messageText, 10);
            if (isNaN(timeEnd) || timeEnd < 0 || (ctx.wizard.state.timeStart && timeEnd <= ctx.wizard.state.timeStart)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeEnd = timeEnd;

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_RESOLUTION, {
                reply_markup: Markup.inlineKeyboard([
                    [
                        Markup.button.callback('1m', '1m'),
                        Markup.button.callback('5m', '5m'),
                        Markup.button.callback('15m', '15m'),
                    ],
                    [
                        Markup.button.callback('30m', '30m'),
                        Markup.button.callback('1h', '1h'),
                        Markup.button.callback('4h', '4h'),
                    ],
                    [
                        Markup.button.callback('1d', '1d'),
                        Markup.button.callback('1w', '1w'),
                        Markup.button.callback('1mo', '1mo'),
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
    async handleOhlcvQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            let resolution: string;
            if (ctx.updateType === 'callback_query') {
                resolution = (ctx.callbackQuery as any).data;
                if (!this.validResolutions.includes(resolution)) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                    );
                    return;
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text?.toLowerCase();
                resolution = this.validResolutions.find(r => r === messageText) || '';
                if (!resolution) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                    );
                    return;
                }
            }

            ctx.wizard.state.resolution = resolution;

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.SEARCHING);

            const { mintAddress, timeStart, timeEnd, resolution: res } = ctx.wizard.state;
            const response = await this.tokensService.getTokenOhlcv(mintAddress!, {
                resolution: res,
                timeStart,
                timeEnd,
                limit: 5, // Limit to 5 for display
            });

            if (!response || response.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_OHLCV.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = response
                .slice(0, 5)
                .map((data, i) => (
                    `<b>${i + 1}. Time: ${new Date(data.time * 1000).toUTCString()}</b>\n` +
                    `📈 <b>Open:</b> ${data.open}\n` +
                    `⬆️ <b>High:</b> ${data.high}\n` +
                    `⬇️ <b>Low:</b> ${data.low}\n` +
                    `📉 <b>Close:</b> ${data.close}\n` +
                    `💹 <b>Volume:</b> ${data.volume}\n` +
                    `💵 <b>Volume USD:</b> ${data.volumeUsd}\n` +
                    `🔢 <b>Trade Count:</b> ${data.count}\n`
                ))
                .join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.TOKEN_OHLCV.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle OHLCV query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_OHLCV_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKEN_OHLCV_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
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