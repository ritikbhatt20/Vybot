import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramRanking } from '../../types';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';
import { ProgramRankingWizardState } from '../../types';

export const PROGRAM_RANKING_SCENE_ID = 'PROGRAM_RANKING_SCENE';

@Wizard(PROGRAM_RANKING_SCENE_ID)
export class ProgramRankingScene {
    private readonly logger = new Logger(ProgramRankingScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askLimit(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_LIMIT,
                { reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask limit step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askInterval(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
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

            let limit: number | undefined;
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('limit:')) {
                    limit = parseInt(data.split(':')[1]);
                    await ctx.answerCbQuery();
                }
            } else {
                if (!messageText || isNaN(parseInt(messageText)) || parseInt(messageText) < 0) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_LIMIT,
                        { reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup }
                    );
                    return;
                }
                limit = parseInt(messageText);
            }

            ctx.wizard.state.limit = limit;

            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_INTERVAL,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('Daily', 'interval:1d'),
                            Markup.button.callback('Weekly', 'interval:7d'),
                            Markup.button.callback('Monthly', 'interval:30d'),
                        ],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask interval step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askDate(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('interval:')) {
                    ctx.wizard.state.interval = data.split(':')[1] as '1d' | '7d' | '30d';
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!['1d', '7d', '30d'].includes(messageText)) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_INTERVAL,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('Daily', 'interval:1d'),
                                    Markup.button.callback('Weekly', 'interval:7d'),
                                    Markup.button.callback('Monthly', 'interval:30d'),
                                ],
                                [
                                    Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                                    Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                                ],
                            ]).reply_markup,
                        }
                    );
                    return;
                }
                ctx.wizard.state.interval = messageText as '1d' | '7d' | '30d';
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_DATE,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Current Date', 'date:current')],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask date step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async handleRankingQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data === 'date:current') {
                    ctx.wizard.state.date = Math.floor(Date.now() / 1000);
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('Current Date', 'date:current')],
                                [
                                    Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                                    Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                                ],
                            ]).reply_markup,
                        }
                    );
                    return;
                }
                ctx.wizard.state.date = parseInt(messageText);
            }

            const { limit, interval, date } = ctx.wizard.state;

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_RANKING.SEARCHING);

            const rankings = await this.programsService.getProgramRanking({
                limit,
                interval,
                date,
            });

            // Ensure rankings is an array
            if (!Array.isArray(rankings) || rankings.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_RANKING.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramRankingResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = rankings
                .map((ranking: ProgramRanking, i: number) => {
                    const name = escapeMarkdownV2(ranking.programName || 'Unknown Program');
                    const programId = ranking.programId;
                    const score = ranking.score.toFixed(4);
                    const rank = ranking.programRank;

                    return (
                        `<b>${i + 1}. ${name} (Rank ${rank})</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `🏆 <b>Score:</b> ${score}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAM_RANKING.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramRankingResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle ranking query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAM_RANKING_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(/limit:\d+/)
    async handleLimitSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.askInterval(ctx);
    }

    @Action(/interval:(1d|7d|30d)/)
    async handleIntervalSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.askDate(ctx);
    }

    @Action('date:current')
    async handleDateSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.handleRankingQuery(ctx);
    }

    @Action(SceneActions.PROGRAM_RANKING_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askLimit(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
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
