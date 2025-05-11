import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { ProgramsWizardState } from '../../types';

export const PROGRAMS_SCENE_ID = 'PROGRAMS_SCENE';

interface WizardSessionData {
    cursor: number;
    current: string;
    state: ProgramsWizardState;
    isFetching?: boolean; // Flag to prevent concurrent fetches
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(PROGRAMS_SCENE_ID)
export class ProgramsScene {
    private readonly logger = new Logger(ProgramsScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${PROGRAMS_SCENE_ID}, step 1: askFilter, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: PROGRAMS_SCENE_ID,
                state: {},
                isFetching: false
            };

            const { programAddress } = ctx.wizard.state;
            this.logger.debug(`Wizard state programAddress: ${programAddress}`);

            if (programAddress && isValidSolanaAddress(programAddress)) {
                await this.fetchAll(ctx);
            } else {
                this.logger.debug('No valid programAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAMS.ASK_FILTER,
                    { reply_markup: this.keyboard.getFilterKeyboard().reply_markup }
                );
                ctx.wizard.next();
                ctx.session.__scenes.cursor = 1;
                this.logger.debug(`Advanced to step 2, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
            }
        } catch (error) {
            this.logger.error(`Error in askFilter: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }

    @WizardStep(2)
    async handleProgramsQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${PROGRAMS_SCENE_ID}, step 2: handleProgramsQuery, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Prevent processing if already fetching
            if (ctx.session.__scenes?.isFetching) {
                this.logger.warn('Fetch already in progress, ignoring request');
                await ctx.answerCbQuery('Please wait, fetching is in progress...');
                return;
            }

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in handleProgramsQuery`);
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

            let params: { labels?: string[]; limit?: number; sortByDesc?: string; programAddress?: string } = {
                limit: 10,
                sortByDesc: 'dau',
            };

            if (!ctx.wizard.state.programAddress && messageText) {
                if (isValidSolanaAddress(messageText)) {
                    ctx.wizard.state.programAddress = messageText;
                    params.programAddress = messageText;
                } else {
                    const labels = messageText.split(',').map((label) => label.trim().toUpperCase());
                    if (labels.length === 0 || labels.some((label) => !label)) {
                        this.logger.warn(`Invalid labels format: ${messageText}`);
                        await ctx.replyWithHTML(
                            BOT_MESSAGES.ERROR.INVALID_FORMAT,
                            { reply_markup: this.keyboard.getFilterKeyboard().reply_markup }
                        );
                        return;
                    }
                    ctx.wizard.state.labels = labels;
                    params.labels = labels;
                }
            } else if (ctx.wizard.state.programAddress) {
                params.programAddress = ctx.wizard.state.programAddress;
            }

            // Set fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = true;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.SEARCHING);

            const programs = await this.programsService.getPrograms(params);

            if (!programs || programs.length === 0) {
                this.logger.debug(`No programs found for params: ${JSON.stringify(params)}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAMS.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const message = programs
                .map((program, i) => {
                    const name = escapeMarkdownV2(program.name || 'Unnamed Program');
                    const programId = escapeMarkdownV2(program.programId);
                    const labels = program.labels?.length ? escapeMarkdownV2(program.labels.filter((label) => label).join(', ')) : 'None';
                    const dau = program.dau.toLocaleString();
                    const transactions = program.transactions1d.toLocaleString();
                    const description = escapeMarkdownV2(program.programDescription || 'No description available');

                    return (
                        `<b>${i + 1}. ${name}</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `🏷️ <b>Labels:</b> ${labels}\n` +
                        `👥 <b>Daily Active Users:</b> ${dau}\n` +
                        `📈 <b>Transactions (1d):</b> ${transactions}\n` +
                        `📝 <b>Description:</b> ${description}\n`
                    );
                })
                .join('\n\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAMS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handleProgramsQuery: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        } finally {
            // Reset fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = false;
            }
        }
    }

    async fetchAll(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing fetchAll, session: ${JSON.stringify(ctx.session)}`);

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
                await ctx.answerCbQuery('📊 Fetching all programs...');
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.SEARCHING);

            const params: { limit: number; sortByDesc: string } = {
                limit: 10,
                sortByDesc: 'dau',
            };

            const programs = await this.programsService.getPrograms(params);

            if (!programs || programs.length === 0) {
                this.logger.debug('No programs found for fetchAll');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAMS.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const message = programs
                .map((program, i) => {
                    const name = escapeMarkdownV2(program.name || 'Unnamed Program');
                    const programId = escapeMarkdownV2(program.programId);
                    const labels = program.labels?.length ? escapeMarkdownV2(program.labels.filter((label) => label).join(', ')) : 'None';
                    const dau = program.dau.toLocaleString();
                    const transactions = program.transactions1d.toLocaleString();
                    const description = escapeMarkdownV2(program.programDescription || 'No description available');

                    return (
                        `<b>${i + 1}. ${name}</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `🏷️ <b>Labels:</b> ${labels}\n` +
                        `👥 <b>Daily Active Users:</b> ${dau}\n` +
                        `📈 <b>Transactions (1d):</b> ${transactions}\n` +
                        `📝 <b>Description:</b> ${description}\n`
                    );
                })
                .join('\n\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAMS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in fetchAll: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        } finally {
            // Reset fetching flag
            if (ctx.session.__scenes) {
                ctx.session.__scenes.isFetching = false;
            }
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.FETCH_ALL:
                    await this.fetchAll(ctx);
                    break;
                case SceneActions.PROGRAMS_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.ASK_FILTER, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(PROGRAMS_SCENE_ID);
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

    private async handleCommand(ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }, command: string) {
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
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
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

    @Action(SceneActions.FETCH_ALL)
    async onFetchAll(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
        try {
            await this.fetchAll(ctx);
        } catch (error) {
            this.logger.error(`Error in onFetchAll: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.PROGRAMS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.selectStep(1);
            await this.askFilter(ctx);
        } catch (error) {
            this.logger.error(`Error in tryAgain: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
        }
    }
}