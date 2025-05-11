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

export const WALLET_PNL_SCENE_ID = 'WALLET_PNL_SCENE';

interface WalletPnlWizardState {
    ownerAddress?: string;
    resolution?: '1d' | '7d' | '30d';
}

interface WizardSessionData {
    cursor: number;
    current: string;
    state: WalletPnlWizardState;
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(WALLET_PNL_SCENE_ID)
export class WalletPnlScene {
    private readonly logger = new Logger(WalletPnlScene.name);

    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askAddress(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${WALLET_PNL_SCENE_ID}, step 1: askAddress, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: WALLET_PNL_SCENE_ID,
                state: {}
            };

            await ctx.replyWithHTML(
                BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS,
                { reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup }
            );

            ctx.wizard.next();
            ctx.session.__scenes.cursor = 1;
            this.logger.debug(`Advanced to step 2, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askAddress: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(2)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${WALLET_PNL_SCENE_ID}, step 2: askResolution, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in askResolution`);
                await ctx.answerCbQuery();
                await ctx.scene.leave();
                await this.handleCallback(ctx, data);
                return;
            }

            const messageText = (ctx.message as { text: string })?.text;
            this.logger.debug(`Received message text: "${messageText}"`);

            // Handle commands
            if (messageText && messageText.startsWith('/')) {
                this.logger.debug(`Command detected in scene: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            if (!messageText || !isValidSolanaAddress(messageText)) {
                this.logger.debug(`Invalid or no Solana address received: ${messageText}`);
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
            ctx.session.__scenes = ctx.session.__scenes || { cursor: 0, current: WALLET_PNL_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 2;
            this.logger.debug(`Advanced to step 3, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askResolution: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(3)
    async handlePnlQuery(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${WALLET_PNL_SCENE_ID}, step 3: handlePnlQuery, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries (e.g., resolution selection)
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if ([SceneActions.CANCEL_BUTTON, SceneActions.MAIN_MENU_BUTTON].includes(data)) {
                    this.logger.debug(`Skipping callback ${data} in handlePnlQuery, handled by @Action`);
                    return;
                }
            }

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
                    this.logger.debug(`Invalid resolution input: ${messageText}`);
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
                this.logger.debug(`Invalid ownerAddress: ${ownerAddress}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getWalletPnlResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.SEARCHING);

            const pnlData = await this.knownAccountsService.getWalletPnl(ownerAddress, { resolution: queryResolution });

            if (!pnlData || (pnlData.tokenMetrics.length === 0 && pnlData.summary.tradesCount === 0)) {
                this.logger.debug(`No PnL data found for address: ${ownerAddress}, resolution: ${queryResolution}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.WALLET_PNL.NO_RESULTS,
                    { reply_markup: this.keyboard.getWalletPnlResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
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
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handlePnlQuery: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.WALLET_PNL_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.WALLET_PNL_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(WALLET_PNL_SCENE_ID);
                    break;
                case 'TOKENS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                        reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
                    });
                    break;
                case 'MARKETS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.MENU, {
                        reply_markup: this.keyboard.getMarketsKeyboard().reply_markup,
                    });
                    break;
                case 'PRICES_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.MENU || 'Price information:', {
                        reply_markup: this.keyboard.getPricesKeyboard().reply_markup,
                    });
                    break;
                case 'PROGRAMS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.MENU || 'Programs information:', {
                        reply_markup: this.keyboard.getProgramsKeyboard().reply_markup,
                    });
                    break;
                case 'ACCOUNTS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.KNOWN_ACCOUNTS.MENU || 'Accounts information:', {
                        reply_markup: this.keyboard.getAccountsKeyboard().reply_markup,
                    });
                    break;
                case 'NFTS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.MENU || 'NFTs information:', {
                        reply_markup: this.keyboard.getNftsKeyboard().reply_markup,
                    });
                    break;
                default:
                    this.logger.debug(`Unknown callback data: ${data}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
            }
        } catch (error) {
            this.logger.error(`Error handling callback after scene exit: ${error.message}`);
            try {
                await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                    reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                });
            } catch (e) {
                this.logger.error(`Failed to send fallback message: ${e.message}`);
            }
        }
    }

    private async handleCommand(ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }, command: string) {
        this.logger.debug(`Handling command after scene exit: ${command}`);

        try {
            switch (command) {
                case '/knownaccounts':
                    await ctx.replyWithHTML(BOT_MESSAGES.KNOWN_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                    break;
                case '/tokenbalances':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesKeyboard().reply_markup,
                    });
                    break;
                case '/tokenbalancests':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES_TS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesTsKeyboard().reply_markup,
                    });
                    break;
                case '/walletpnl':
                    await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup,
                    });
                    break;
                case '/nftowners':
                    await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getNftCollectionOwnersKeyboard().reply_markup,
                    });
                    break;
                case '/tokens':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                        reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
                    });
                    break;
                case '/tokenholders':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup,
                    });
                    break;
                case '/tokendetails':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup,
                    });
                    break;
                case '/tokenvolume':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_VOLUME.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup,
                    });
                    break;
                case '/tokenholdersts':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup,
                    });
                    break;
                case '/tokentransfers':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup,
                    });
                    break;
                case '/tokentrades':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRADES.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup,
                    });
                    break;
                case '/tokenohlcv':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
                    });
                    break;
                case '/programs':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.ASK_FILTER, {
                        reply_markup: this.keyboard.getProgramsKeyboard().reply_markup,
                    });
                    break;
                case '/programtxcount':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_TX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup,
                    });
                    break;
                case '/programixcount':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_IX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup,
                    });
                    break;
                case '/programactiveusersts':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS_TS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersTsKeyboard().reply_markup,
                    });
                    break;
                case '/programactiveusers':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersKeyboard().reply_markup,
                    });
                    break;
                case '/programdetails':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_DETAILS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramDetailsKeyboard().reply_markup,
                    });
                    break;
                case '/programranking':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_RANKING.ASK_LIMIT, {
                        reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup,
                    });
                    break;
                case '/pythaccounts':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythprice':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythpricets':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythpriceohlc':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythproduct':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRODUCT.ASK_PRODUCT_ID, {
                        reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup,
                    });
                    break;
                case '/dexamm':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.DEX_AMM.SEARCHING, {
                        reply_markup: this.keyboard.getDexAmmResultsKeyboard().reply_markup,
                    });
                    break;
                case '/markets':
                    await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.MENU, {
                        reply_markup: this.keyboard.getMarketsKeyboard().reply_markup,
                    });
                    break;
                case '/tokenprice':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.TOKEN_PRICE.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup,
                    });
                    break;
                case '/help':
                    await ctx.replyWithHTML(BOT_MESSAGES.HELP_HEADER, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                case '/main_menu':
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                case '/cancel':
                    await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                default:
                    this.logger.debug(`Unknown command: ${command}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
            }
        } catch (error) {
            this.logger.error(`Error handling command after scene exit: ${error.message}`);
            try {
                await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                    reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                });
            } catch (e) {
                this.logger.error(`Failed to send fallback message: ${e.message}`);
            }
        }
    }

    @Action(/resolution:(1d|7d|30d)/)
    async handleResolutionSelection(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        await this.handlePnlQuery(ctx);
    }

    @Action(SceneActions.WALLET_PNL_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.selectStep(1);
            await this.askAddress(ctx);
        } catch (error) {
            this.logger.error(`Error in tryAgain: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Operation cancelled');
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onCancel: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Returning to main menu');
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onMainMenu: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: WalletPnlWizardState }, session: CustomSession }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in cancelCommand: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }
}