import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { TokenOhlcv } from '../../types';

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
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                ctx.wizard.state.mintAddress = mintAddress;
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_OHLCV.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenOhlcvWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (messageText && messageText.startsWith('/')) {
                this.logger.debug(`Command detected in scene: ${messageText}, exiting scene`);
                ctx.session = {}; // Clear session state
                await ctx.scene.leave();

                // Handle specific commands with their respective menus or prompts
                if (messageText === '/knownaccounts') {
                    await ctx.replyWithHTML(BOT_MESSAGES.KNOWN_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenbalances') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenbalancests') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES_TS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesTsKeyboard().reply_markup,
                    });
                } else if (messageText === '/walletpnl') {
                    await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup,
                    });
                } else if (messageText === '/nftowners') {
                    await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getNftCollectionOwnersKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokens') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                        reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenholders') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokendetails') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenvolume') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_VOLUME.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenholdersts') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokentransfers') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokentrades') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRADES.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenohlcv') {
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/programs') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.ASK_FILTER, {
                        reply_markup: this.keyboard.getProgramsKeyboard().reply_markup,
                    });
                } else if (messageText === '/programtxcount') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_TX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup,
                    });
                } else if (messageText === '/programixcount') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_IX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup,
                    });
                } else if (messageText === '/programactiveusersts') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS_TS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersTsKeyboard().reply_markup,
                    });
                } else if (messageText === '/programactiveusers') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersKeyboard().reply_markup,
                    });
                } else if (messageText === '/programdetails') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_DETAILS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramDetailsKeyboard().reply_markup,
                    });
                } else if (messageText === '/programranking') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_RANKING.ASK_LIMIT, {
                        reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup,
                    });
                } else if (messageText === '/pythaccounts') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/pythprice') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/pythpricets') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/pythpriceohlc') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/pythproduct') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRODUCT.ASK_PRODUCT_ID, {
                        reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/dexamm') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.DEX_AMM.SEARCHING, {
                        reply_markup: this.keyboard.getDexAmmResultsKeyboard().reply_markup,
                    });
                } else if (messageText === '/markets') {
                    await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.MENU, {
                        reply_markup: this.keyboard.getMarketsKeyboard().reply_markup,
                    });
                } else if (messageText === '/tokenprice') {
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.TOKEN_PRICE.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup,
                    });
                } else if (messageText === '/help') {
                    await ctx.replyWithHTML(BOT_MESSAGES.HELP_HEADER, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                } else if (messageText === '/main_menu') {
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                } else if (messageText === '/cancel') {
                    await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                }
                return;
            }

            if (!ctx.wizard.state.mintAddress) {
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_OHLCV.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
            );
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
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeStart = timeStart;

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_OHLCV.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
            );
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
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeEnd = timeEnd;

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_OHLCV.ASK_RESOLUTION,
                {
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
                },
            );
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
                        { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                    );
                    return;
                }
                await ctx.answerCbQuery();
            } else {
                const messageText = (ctx.message as { text: string })?.text?.toLowerCase();
                resolution = this.validResolutions.find(r => r === messageText) || '';
                if (!resolution) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                    );
                    return;
                }
            }

            ctx.wizard.state.resolution = resolution;

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.SEARCHING);

            const { mintAddress, timeStart, timeEnd, resolution: res } = ctx.wizard.state;
            if (!mintAddress || !timeStart || !timeEnd || !res) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                );
                return;
            }

            const response = await this.tokensService.getTokenOhlcv(mintAddress, {
                resolution: res,
                timeStart,
                timeEnd,
                limit: 5,
            });

            if (!response || response.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_OHLCV.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
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

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_OHLCV.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle OHLCV query step: ${error.message}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup },
                );
                ctx.wizard.selectStep(2);
                await this.askStartTime(ctx);
            } else {
                await handleErrorResponse({
                    ctx,
                    error,
                    defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                    buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_OHLCV_AGAIN }],
                });
                await ctx.scene.leave();
            }
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
