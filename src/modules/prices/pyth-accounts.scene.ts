import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';
import { PythAccount } from '../../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export const PYTH_ACCOUNTS_SCENE_ID = 'PYTH_ACCOUNTS_SCENE';

interface PythAccountsWizardState {
    productId?: string;
    priceFeedId?: string;
    symbol?: string;
}

interface WizardSessionData {
    cursor: number;
    current: string;
    state: PythAccountsWizardState;
    isFetching?: boolean; // Flag to prevent concurrent fetches
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(PYTH_ACCOUNTS_SCENE_ID)
export class PythAccountsScene {
    private readonly logger = new Logger(PythAccountsScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${PYTH_ACCOUNTS_SCENE_ID}, step 1: askFilter, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: PYTH_ACCOUNTS_SCENE_ID,
                state: {},
                isFetching: false
            };

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
            });

            ctx.wizard.next();
            ctx.session.__scenes.cursor = 1;
            this.logger.debug(`Advanced to step 2, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askFilter: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
        }
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PYTH_ACCOUNTS_SCENE_ID}, step 2: handleFilter, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Prevent processing if already fetching
            if (ctx.session.__scenes?.isFetching) {
                this.logger.warn('Fetch already in progress, ignoring request');
                await ctx.answerCbQuery('Please wait, fetching is in progress...');
                return;
            }

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in handleFilter`);
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

            let params: any = {};

            if (messageText && messageText !== SceneActions.FETCH_ALL) {
                try {
                    const pairs = messageText.split(',').map((p) => p.trim().split('='));
                    pairs.forEach(([key, value]) => {
                        if (['productId', 'priceFeedId', 'symbol'].includes(key)) {
                            params[key] = value;
                        }
                    });

                    ctx.wizard.state.productId = params.productId;
                    ctx.wizard.state.priceFeedId = params.priceFeedId;
                    ctx.wizard.state.symbol = params.symbol;
                } catch (error) {
                    this.logger.warn(`Invalid filter format: ${messageText}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.ERROR.INVALID_FORMAT, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                    return;
                }
            }

            await this.handleFetch(ctx, params);
        } catch (error) {
            this.logger.error(`Error in handleFilter: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.GENERIC,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        } finally {
            // Reset fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = false;
            }
        }
    }

    async handleFetch(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }, params: any) {
        let tempFilePath: string | undefined;
        try {
            this.logger.debug(`Processing handleFetch, params: ${JSON.stringify(params)}, session: ${JSON.stringify(ctx.session)}`);

            // Prevent concurrent fetches
            if (ctx.session.__scenes?.isFetching) {
                this.logger.warn('Fetch already in progress, ignoring request');
                await ctx.answerCbQuery('Please wait, fetching is in progress...');
                return;
            }

            // Set fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = true;
            }

            if (ctx.updateType === 'callback_query') {
                await ctx.answerCbQuery('🔍 Searching...');
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.SEARCHING);

            // Fetch accounts
            const fetchAll = Object.keys(params).length === 0; // FETCH_ALL when params are empty
            const apiParams = fetchAll ? {} : params;
            const accounts = await this.pricesService.getPythAccounts(apiParams);
            this.logger.debug(`Fetched ${accounts.length} Pyth accounts`);

            if (!accounts || accounts.length === 0) {
                this.logger.debug(`No Pyth accounts found for params: ${JSON.stringify(apiParams)}`);
                await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.NO_RESULTS, {
                    reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                });
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            // Display up to 10 accounts in the reply
            const displayAccounts = accounts.slice(0, 10);
            const message = displayAccounts
                .map((acc: PythAccount, i: number) => {
                    const symbol = acc.symbol ? escapeMarkdownV2(acc.symbol) : 'N/A';
                    const productId = acc.productId ? acc.productId : 'N/A';
                    const priceFeedId = acc.priceFeedId;

                    return (
                        `<b>${i + 1}. ${symbol}</b>\n` +
                        `📍 <b>Price Feed ID:</b> <code>${priceFeedId}</code>\n` +
                        `🛠️ <b>Product ID:</b> <code>${productId}</code>\n`
                    );
                })
                .join('\n\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
            });

            // If FETCH_ALL, generate and send a JSON file with all accounts
            if (fetchAll) {
                const timestamp = new Date().toISOString().split('T')[0]; // e.g., 2025-05-11
                const fileName = `all_pyth_accounts_${timestamp}.json`;
                tempFilePath = path.join('/tmp', fileName);
                const fileContent = JSON.stringify(accounts, null, 2); // Pretty print JSON

                // Check file size (Telegram limit: 50MB)
                const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');
                const fileSizeMB = fileSizeBytes / (1024 * 1024);
                if (fileSizeMB > 50) {
                    this.logger.warn(`File size (${fileSizeMB.toFixed(2)} MB) exceeds Telegram limit of 50 MB`);
                    await ctx.replyWithHTML(
                        '⚠️ The complete Pyth accounts list is too large to send as a file (>50 MB). Displaying top 10 accounts only.',
                        { reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup }
                    );
                    await ctx.scene.leave();
                    ctx.session = {};
                    return;
                }

                // Write file
                await fs.writeFile(tempFilePath, fileContent);
                this.logger.debug(`Wrote ${accounts.length} accounts to ${tempFilePath}`);

                // Send file as document
                await ctx.replyWithDocument(
                    { source: tempFilePath, filename: fileName },
                    {
                        caption: `📄 Complete list of ${accounts.length} Pyth accounts (JSON format).`,
                        reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                    }
                );
            }

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handleFetch: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        } finally {
            // Reset fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = false;
            }

            // Clean up temporary file
            if (tempFilePath) {
                try {
                    await fs.unlink(tempFilePath);
                    this.logger.debug(`Deleted temporary file ${tempFilePath}`);
                } catch (err) {
                    this.logger.error(`Failed to delete temporary file ${tempFilePath}: ${err.message}`);
                }
            }
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.FETCH_ALL:
                    await this.handleFetch(ctx, {});
                    break;
                case SceneActions.PYTH_ACCOUNTS_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(PYTH_ACCOUNTS_SCENE_ID);
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
                case SceneActions.CANCEL_BUTTON:
                case SceneActions.CLOSE_BUTTON:
                    await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                default:
                    this.logger.debug(`Unknown callback data: ${data}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
            }
        } catch (error) {
            this.logger.error(`Error handling callback after scene exit: ${error.message}, stack: ${error.stack}`);
            try {
                await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                    reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                });
            } catch (e) {
                this.logger.error(`Failed to send fallback message: ${e.message}`);
            }
        }
    }

    private async handleCommand(ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }, command: string) {
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
            this.logger.error(`Error handling command after scene exit: ${error.message}, stack: ${error.stack}`);
            try {
                await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                    reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                });
            } catch (e) {
                this.logger.error(`Failed to send fallback message: ${e.message}`);
            }
        }
    }

    @Action(SceneActions.PYTH_ACCOUNTS_AGAIN)
    async filterAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.selectStep(1);
            await this.askFilter(ctx);
        } catch (error) {
            this.logger.error(`Error in filterAgain: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Operation cancelled');
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onCancel: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Returning to main menu');
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onMainMenu: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState }, session: CustomSession }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in cancelCommand: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
        }
    }
}
