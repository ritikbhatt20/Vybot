import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { PythPrice, PythPriceError } from '../../types';
import { Markup } from 'telegraf';

export const PYTH_PRICE_TS_SCENE_ID = 'PYTH_PRICE_TS_SCENE';

interface PythPriceTsWizardState {
    priceFeedId?: string;
    timeStart?: number;
    timeEnd?: number;
    resolution?: string;
}

interface WizardSessionData {
    cursor: number;
    current: string;
    state: PythPriceTsWizardState;
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(PYTH_PRICE_TS_SCENE_ID)
export class PythPriceTsScene {
    private readonly logger = new Logger(PythPriceTsScene.name);
    private readonly validResolutions = ['1h', '1d', '1w', '1m', '1y'];

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askPriceFeedId(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${PYTH_PRICE_TS_SCENE_ID}, step 1: askPriceFeedId, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: PYTH_PRICE_TS_SCENE_ID,
                state: {}
            };

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_PRICE_FEED_ID, {
                reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
            });

            ctx.wizard.next();
            ctx.session.__scenes.cursor = 1;
            this.logger.debug(`Advanced to step 2, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askPriceFeedId: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PYTH_PRICE_TS_SCENE_ID}, step 2: askStartTime, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in askStartTime`);
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
                    { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.priceFeedId = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_START_TIME, {
                reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
            });

            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes ?? { cursor: 0, current: PYTH_PRICE_TS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 2;
            this.logger.debug(`Advanced to step 3, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askStartTime: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PYTH_PRICE_TS_SCENE_ID}, step 3: askEndTime, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in askEndTime`);
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

            const timeStart = parseInt(messageText, 10);
            if (isNaN(timeStart) || timeStart < 0) {
                this.logger.debug(`Invalid timestamp input: ${messageText}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeStart = timeStart;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_END_TIME, {
                reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
            });

            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes ?? { cursor: 0, current: PYTH_PRICE_TS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 3;
            this.logger.debug(`Advanced to step 4, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askEndTime: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(4)
    async askResolution(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PYTH_PRICE_TS_SCENE_ID}, step 4: askResolution, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

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

            const timeEnd = parseInt(messageText, 10);
            if (isNaN(timeEnd) || timeEnd < 0 || (ctx.wizard.state.timeStart && timeEnd <= ctx.wizard.state.timeStart)) {
                this.logger.debug(`Invalid timestamp input: ${messageText}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeEnd = timeEnd;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_RESOLUTION, {
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
            ctx.session.__scenes = ctx.session.__scenes ?? { cursor: 0, current: PYTH_PRICE_TS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 4;
            this.logger.debug(`Advanced to step 5, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askResolution: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @WizardStep(5)
    async handlePriceTsQuery(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PYTH_PRICE_TS_SCENE_ID}, step 5: handlePriceTsQuery, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in handlePriceTsQuery`);
                await ctx.answerCbQuery();
                if (this.validResolutions.includes(data)) {
                    ctx.wizard.state.resolution = data;
                } else {
                    await ctx.scene.leave();
                    await this.handleCallback(ctx, data);
                    return;
                }
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

            // Handle resolution input if not set by callback
            if (!ctx.wizard.state.resolution) {
                const text = messageText?.toLowerCase();
                const resolutionMap: { [key: string]: string } = {
                    'hourly': '1h', 'daily': '1d', 'weekly': '1w', 'monthly': '1m', 'yearly': '1y',
                    '1h': '1h', '1d': '1d', '1w': '1w', '1m': '1m', '1y': '1y'
                };
                const resolution = text && resolutionMap[text];
                if (!resolution) {
                    this.logger.debug(`Invalid resolution input: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_RESOLUTION,
                        { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                    );
                    return;
                }
                ctx.wizard.state.resolution = resolution;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.SEARCHING);

            const { priceFeedId, timeStart, timeEnd, resolution } = ctx.wizard.state;
            const response = await this.pricesService.getPythPriceTs(priceFeedId!, {
                resolution,
                timeStart,
                timeEnd,
                limit: 5,
            });

            if ('code' in response && 'message' in response) {
                this.logger.debug(`API error: ${response.message}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRICE_TS.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const priceData = response as PythPrice[];
            if (!priceData || priceData.length === 0) {
                this.logger.debug(`No price data found for priceFeedId: ${priceFeedId}, timeStart: ${timeStart}, timeEnd: ${timeEnd}, resolution: ${resolution}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRICE_TS.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const message = priceData
                .slice(0, 5)
                .map((data, i) => (
                    `<b>${i + 1}. Time: ${new Date(data.lastUpdated * 1000).toUTCString()}</b>\n` +
                    `💸 <b>Price:</b> ${data.price}\n` +
                    `📊 <b>Confidence:</b> ${data.confidence}\n` +
                    `🎰 <b>Valid Slot:</b> ${data.validSlot}\n`
                ))
                .join('\n\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_PRICE_TS.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handlePriceTsQuery: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_PRICE_TS_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.PYTH_PRICE_TS_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(PYTH_PRICE_TS_SCENE_ID);
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

    private async handleCommand(ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }, command: string) {
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

    @Action(SceneActions.PYTH_PRICE_TS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.selectStep(1);
            await this.askPriceFeedId(ctx);
        } catch (error) {
            this.logger.error(`Error in tryAgain: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
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
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
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
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceTsWizardState }, session: CustomSession }) {
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