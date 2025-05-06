import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress } from '../../utils';
import { TokenTradesWizardState } from '../../types';

export const TOKEN_TRADES_SCENE_ID = 'TOKEN_TRADES_SCENE';

@Wizard(TOKEN_TRADES_SCENE_ID)
export class TokenTradesScene {
    private readonly logger = new Logger(TokenTradesScene.name);

    private readonly resolutionMap: { [key: string]: string } = {
        '1h': '1h',
        '1d': '1d',
        '1w': '1w',
        '1m': '1m',
        '1y': '1y',
    };

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        try {
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                ctx.wizard.state.mintAddress = mintAddress;
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRADES.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        try {
            if (!ctx.wizard.state.mintAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRADES.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeStart = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRADES.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeEnd = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRADES.ASK_RESOLUTION,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('Hourly', 'resolution:1h'),
                            Markup.button.callback('Daily', 'resolution:1d'),
                            Markup.button.callback('Weekly', 'resolution:1w'),
                        ],
                        [
                            Markup.button.callback('Monthly', 'resolution:1m'),
                            Markup.button.callback('Yearly', 'resolution:1y'),
                        ],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask resolution step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(5)
    async handleTradesQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        try {
            let resolution = (ctx.message as { text: string })?.text;
            if (ctx.updateType === 'callback_query') {
                resolution = (ctx.callbackQuery as any).data.split(':')[1];
                await ctx.answerCbQuery();
            }

            if (!resolution || !['1h', '1d', '1w', '1m', '1y'].includes(resolution)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.resolution = resolution;

            const { mintAddress, timeStart, timeEnd } = ctx.wizard.state;

            if (!mintAddress || !timeStart || !timeEnd) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRADES.SEARCHING);

            const trades = await this.tokensService.getTokenTrades({
                mintAddress,
                timeStart,
                timeEnd,
                resolution: this.resolutionMap[resolution],
                limit: 10,
                sortByDesc: 'blockTime',
            });

            if (!trades || trades.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRADES.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenTradesResultsKeyboard().reply_markup },
                );
                await ctx.scene.leave();
                return;
            }

            const message = trades
                .map((trade, i) => {
                    const date = new Date(trade.blockTime * 1000).toISOString().split('T')[0];
                    const price = parseFloat(trade.price).toLocaleString();
                    const baseSize = parseFloat(trade.baseSize).toLocaleString();
                    const quoteSize = parseFloat(trade.quoteSize).toLocaleString();
                    const marketId = trade.marketId;
                    const signature = trade.signature;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `📜 <b>Signature:</b> <code>${signature}</code>\n` +
                        `🏛️ <b>Market ID:</b> <code>${marketId}</code>\n` +
                        `💵 <b>Price:</b> ${price}\n` +
                        `📊 <b>Base Size:</b> ${baseSize}\n` +
                        `📈 <b>Quote Size:</b> ${quoteSize}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_TRADES.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenTradesResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle trades query step: ${error.message}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRADES.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup },
                );
                ctx.wizard.selectStep(2);
                await this.askStartTime(ctx);
            } else {
                await handleErrorResponse({
                    ctx,
                    error,
                    defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                    buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRADES_AGAIN }],
                });
                await ctx.scene.leave();
            }
        }
    }

    @Action('resolution:1h')
    @Action('resolution:1d')
    @Action('resolution:1w')
    @Action('resolution:1m')
    @Action('resolution:1y')
    async handleResolutionSelection(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        await this.handleTradesQuery(ctx);
    }

    @Action(SceneActions.TOKEN_TRADES_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenTradesWizardState } }) {
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
