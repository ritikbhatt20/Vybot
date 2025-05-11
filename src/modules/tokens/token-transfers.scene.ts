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
import { TokenTransfersWizardState } from '../../types';

export const TOKEN_TRANSFERS_SCENE_ID = 'TOKEN_TRANSFERS_SCENE';

interface WizardSessionData {
    cursor: number;
    current: string;
    state: TokenTransfersWizardState;
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(TOKEN_TRANSFERS_SCENE_ID)
export class TokenTransfersScene {
    private readonly logger = new Logger(TokenTransfersScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${TOKEN_TRANSFERS_SCENE_ID}, step 1: askMintAddress, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: TOKEN_TRANSFERS_SCENE_ID,
                state: {}
            };

            const { mintAddress } = ctx.wizard.state;
            this.logger.debug(`Wizard state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                ctx.wizard.next();
                ctx.session.__scenes.cursor = 1;
                this.logger.debug(`Advanced to step 2, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
            }
        } catch (error) {
            this.logger.error(`Error in askMintAddress: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_TRANSFERS_SCENE_ID}, step 2: askStartTime, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

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

            if (!ctx.wizard.state.mintAddress) {
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_MINT_ADDRESS,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
            );
            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes || { cursor: 0, current: TOKEN_TRANSFERS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 2;
            this.logger.debug(`Advanced to step 3, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askStartTime: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_TRANSFERS_SCENE_ID}, step 3: askEndTime, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

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

            if (!messageText || isNaN(parseInt(messageText))) {
                this.logger.warn(`Invalid start time provided: ${messageText}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            const timeStart = parseInt(messageText);
            const now = Math.floor(Date.now() / 1000);
            if (timeStart < 0 || timeStart > now) {
                this.logger.warn(`Start time out of valid range: ${timeStart}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeStart = timeStart;

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
            );
            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes || { cursor: 0, current: TOKEN_TRANSFERS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 3;
            this.logger.debug(`Advanced to step 4, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askEndTime: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @WizardStep(4)
    async askMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_TRANSFERS_SCENE_ID}, step 4: askMinAmount, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in askMinAmount`);
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

            if (!messageText || isNaN(parseInt(messageText))) {
                this.logger.warn(`Invalid end time provided: ${messageText}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            const timeEnd = parseInt(messageText);
            const now = Math.floor(Date.now() / 1000);
            if (timeEnd < 0 || timeEnd > now || (ctx.wizard.state.timeStart && timeEnd <= ctx.wizard.state.timeStart)) {
                this.logger.warn(`End time out of valid range: ${timeEnd}, startTime: ${ctx.wizard.state.timeStart}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeEnd = timeEnd;

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MIN_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:minAmount')],
                        [
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                            Markup.button.callback('❌ Cancel', SceneActions.CANCEL_BUTTON),
                        ],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes || { cursor: 0, current: TOKEN_TRANSFERS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 4;
            this.logger.debug(`Advanced to step 5, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askMinAmount: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @WizardStep(5)
    async askMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_TRANSFERS_SCENE_ID}, step 5: askMaxAmount, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in askMaxAmount`);

                if (data === 'skip:minAmount') {
                    await ctx.answerCbQuery();
                } else {
                    await ctx.answerCbQuery();
                    await ctx.scene.leave();
                    await this.handleCallback(ctx, data);
                    return;
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                this.logger.debug(`Received message text: "${messageText}"`);

                // Handle commands
                if (messageText && messageText.startsWith('/')) {
                    this.logger.debug(`Command detected in scene: ${messageText}, exiting scene`);
                    await ctx.scene.leave();
                    await this.handleCommand(ctx, messageText);
                    return;
                }

                if (!messageText || isNaN(parseFloat(messageText))) {
                    this.logger.warn(`Invalid min amount provided: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }

                const minAmount = parseFloat(messageText);
                if (minAmount < 0) {
                    this.logger.warn(`Negative min amount provided: ${minAmount}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }

                ctx.wizard.state.minAmount = minAmount;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MAX_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:maxAmount')],
                        [
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                            Markup.button.callback('❌ Cancel', SceneActions.CANCEL_BUTTON),
                        ],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
            ctx.session.__scenes = ctx.session.__scenes ?? { cursor: 0, current: TOKEN_TRANSFERS_SCENE_ID, state: {} };
            ctx.session.__scenes.cursor = 5;
            this.logger.debug(`Advanced to step 6, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);
        } catch (error) {
            this.logger.error(`Error in askMaxAmount: ${error.message}, stack: ${error.stack}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @WizardStep(6)
    async handleTransfersQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_TRANSFERS_SCENE_ID}, step 6: handleTransfersQuery, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            let maxAmount: number | undefined;
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}`);

                if (data === 'skip:maxAmount') {
                    await ctx.answerCbQuery();
                } else {
                    this.logger.debug(`Non-skip callback received: ${data}, handling in handleCallback`);
                    await ctx.answerCbQuery();
                    await ctx.scene.leave();
                    await this.handleCallback(ctx, data);
                    return;
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                this.logger.debug(`Received message text: "${messageText}"`);

                // Handle commands
                if (messageText && messageText.startsWith('/')) {
                    this.logger.debug(`Command detected in scene: ${messageText}, exiting scene`);
                    await ctx.scene.leave();
                    await this.handleCommand(ctx, messageText);
                    return;
                }

                if (!messageText || isNaN(parseFloat(messageText))) {
                    this.logger.warn(`Invalid max amount provided: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }

                maxAmount = parseFloat(messageText);
                if (maxAmount < 0) {
                    this.logger.warn(`Negative max amount provided: ${maxAmount}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }

                ctx.wizard.state.maxAmount = maxAmount;
            }

            const { mintAddress, timeStart, timeEnd, minAmount, maxAmount: stateMaxAmount } = ctx.wizard.state;

            if (!mintAddress || !timeStart || !timeEnd) {
                this.logger.debug(`Missing required parameters: mintAddress=${mintAddress}, timeStart=${timeStart}, timeEnd=${timeEnd}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            if (minAmount && stateMaxAmount && minAmount > stateMaxAmount) {
                this.logger.warn(`Invalid amount range: minAmount=${minAmount}, maxAmount=${stateMaxAmount}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.INVALID_AMOUNT_RANGE,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                ctx.wizard.selectStep(4);
                await this.askMinAmount(ctx);
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.SEARCHING);

            const transfers = await this.tokensService.getTokenTransfers({
                mintAddress,
                timeStart,
                timeEnd,
                minAmount,
                maxAmount: stateMaxAmount,
                limit: 10,
                sortByDesc: 'blockTime',
            });

            if (!transfers || transfers.length === 0) {
                this.logger.debug(`No transfers found for mintAddress: ${mintAddress}, timeStart: ${timeStart}, timeEnd: ${timeEnd}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const tokenDetails = await this.tokensService.getTokenDetails(mintAddress);
            const tokenName = tokenDetails ? escapeMarkdownV2(tokenDetails.name || 'Unknown') : 'Unknown';
            const tokenSymbol = tokenDetails ? escapeMarkdownV2(tokenDetails.symbol || 'N/A') : 'N/A';

            const message = transfers
                .map((transfer, i) => {
                    const date = escapeMarkdownV2(new Date(transfer.blockTime * 1000).toISOString().split('T')[0]);
                    const amount = parseFloat(transfer.calculatedAmount).toLocaleString();
                    const valueUsd = `$${parseFloat(transfer.valueUsd).toLocaleString()}`;
                    const signature = escapeMarkdownV2(transfer.signature);
                    const sender = escapeMarkdownV2(transfer.senderAddress);
                    const receiver = escapeMarkdownV2(transfer.receiverAddress);

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `📜 <b>Signature:</b> <code>${signature}</code>\n` +
                        `➡️ <b>Sender:</b> <code>${sender}</code>\n` +
                        `⬅️ <b>Receiver:</b> <code>${receiver}</code>\n` +
                        `💸 <b>Amount:</b> ${amount}\n` +
                        `💵 <b>Value (USD):</b> ${valueUsd}\n`
                    );
                })
                .join('\n\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_TRANSFERS.RESULTS_HEADER.replace('{token}', `${tokenName} (${tokenSymbol})`)}${message}`,
                { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handleTransfersQuery: ${error.message}, stack: ${error.stack}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                ctx.wizard.selectStep(2);
                await this.askStartTime(ctx);
            } else {
                await handleErrorResponse({
                    ctx,
                    error,
                    defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                    buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
                });
                await ctx.scene.leave();
                ctx.session = {};
            }
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.TOKEN_TRANSFERS_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID);
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

    private async handleCommand(ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }, command: string) {
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

    @Action('skip:minAmount')
    async skipMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        await this.askMaxAmount(ctx);
    }

    @Action('skip:maxAmount')
    async skipMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        await this.handleTransfersQuery(ctx);
    }

    @Action(SceneActions.TOKEN_TRANSFERS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.selectStep(1);
            await this.askMintAddress(ctx);
        } catch (error) {
            this.logger.error(`Error in tryAgain: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
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
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
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
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState }, session: CustomSession }) {
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
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
        }
    }
}
