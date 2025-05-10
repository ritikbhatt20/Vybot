import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { KnownAccountsService } from './known-accounts.service';
import { WalletPnlResponse } from '../../types';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { WalletPnlWizardState } from '../../types';

export const WALLET_PNL_SCENE_ID = 'WALLET_PNL_SCENE';

@Wizard(WALLET_PNL_SCENE_ID)
export class WalletPnlScene {
    private readonly logger = new Logger(WalletPnlScene.name);

    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askAddress(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS,
                { reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
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

            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.ownerAddress = messageText;

            await ctx.replyWithHTML(
                BOT_MESSAGES.WALLET_PNL.ASK_RESOLUTION,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('1 Day', 'resolution:1d'),
                            Markup.button.callback('7 Days', 'resolution:7d'),
                            Markup.button.callback('30 Days', 'resolution:30d'),
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
            this.logger.error(`Error in ask resolution step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async handlePnlQuery(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        try {
            let resolution: '1d' | '7d' | '30d' | undefined;
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('resolution:')) {
                    resolution = data.split(':')[1] as '1d' | '7d' | '30d';
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !['1d', '7d', '30d'].includes(messageText.toLowerCase())) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('1 Day', 'resolution:1d'),
                                    Markup.button.callback('7 Days', 'resolution:7d'),
                                    Markup.button.callback('30 Days', 'resolution:30d'),
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
                resolution = messageText.toLowerCase() as '1d' | '7d' | '30d';
            }

            ctx.wizard.state.resolution = resolution;

            const { ownerAddress, resolution: queryResolution } = ctx.wizard.state;

            if (!ownerAddress || !isValidSolanaAddress(ownerAddress)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getWalletPnlResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.SEARCHING);

            const pnlData = await this.knownAccountsService.getWalletPnl(ownerAddress, { resolution: queryResolution });

            if (!pnlData || (pnlData.tokenMetrics.length === 0 && pnlData.summary.tradesCount === 0)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.WALLET_PNL.NO_RESULTS,
                    { reply_markup: this.keyboard.getWalletPnlResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const summaryMessage = [
                `<b>Wallet PnL Summary (${queryResolution})</b>`,
                `📈 <b>Win Rate:</b> ${escapeMarkdownV2((pnlData.summary.winRate * 100).toFixed(2))}%`,
                `💰 <b>Realized PnL (USD):</b> $${escapeMarkdownV2(pnlData.summary.realizedPnlUsd.toFixed(2))}`,
                `📊 <b>Unrealized PnL (USD):</b> $${escapeMarkdownV2(pnlData.summary.unrealizedPnlUsd.toFixed(2))}`,
                `🔢 <b>Unique Tokens Traded:</b> ${escapeMarkdownV2(pnlData.summary.uniqueTokensTraded.toString())}`,
                `💸 <b>Average Trade (USD):</b> $${escapeMarkdownV2(pnlData.summary.averageTradeUsd.toFixed(2))}`,
                `📝 <b>Total Trades:</b> ${escapeMarkdownV2(pnlData.summary.tradesCount.toString())}`,
                `✅ <b>Winning Trades:</b> ${escapeMarkdownV2(pnlData.summary.winningTradesCount.toString())}`,
                `❌ <b>Losing Trades:</b> ${escapeMarkdownV2(pnlData.summary.losingTradesCount.toString())}`,
                `📉 <b>Trade Volume (USD):</b> $${escapeMarkdownV2(pnlData.summary.tradesVolumeUsd.toFixed(2))}`,
                `🏆 <b>Best Token:</b> ${pnlData.summary.bestPerformingToken ? escapeMarkdownV2(pnlData.summary.bestPerformingToken) : 'N/A'}`,
                `📉 <b>Worst Token:</b> ${pnlData.summary.worstPerformingToken ? escapeMarkdownV2(pnlData.summary.worstPerformingToken) : 'N/A'}`,
            ].join('\n');

            const tokenMetricsMessage = pnlData.tokenMetrics
                .slice(0, 5)
                .map((metric, i) => {
                    return [
                        `<b>${i + 1}. Token: ${escapeMarkdownV2(metric.tokenSymbol)} (${metric.tokenAddress})</b>`,
                        `📈 <b>Buys:</b> ${escapeMarkdownV2(metric.buysTransactionCount.toString())} trades, $${escapeMarkdownV2(metric.buysVolumeUsd.toFixed(2))}`,
                        `📉 <b>Sells:</b> ${escapeMarkdownV2(metric.sellsTransactionCount.toString())} trades, $${escapeMarkdownV2(metric.sellsVolumeUsd.toFixed(2))}`,
                        `💰 <b>Realized PnL:</b> $${escapeMarkdownV2(metric.realizedPnlUsd.toFixed(2))}`,
                        `📊 <b>Unrealized PnL:</b> $${escapeMarkdownV2(metric.unrealizedPnlUsd.toFixed(2))}`,
                    ].join('\n');
                })
                .join('\n\n');

            const finalMessage = [summaryMessage, tokenMetricsMessage].filter(Boolean).join('\n\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.WALLET_PNL.RESULTS_HEADER}${finalMessage}`,
                { reply_markup: this.keyboard.getWalletPnlResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle PnL query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.WALLET_PNL_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(/resolution:(1d|7d|30d)/)
    async handleResolutionSelection(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        await this.handlePnlQuery(ctx);
    }

    @Action(SceneActions.WALLET_PNL_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState } }) {
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