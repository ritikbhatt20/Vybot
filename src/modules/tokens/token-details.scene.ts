import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2, isValidSolanaAddress } from '../../utils';

export const TOKEN_DETAILS_SCENE_ID = 'TOKEN_DETAILS_SCENE';

interface TokenDetailsWizardState {
    mintAddress?: string;
}

interface WizardSessionData {
    cursor: number;
    current: string;
    state: TokenDetailsWizardState;
}

interface CustomSession {
    __scenes?: WizardSessionData;
}

@Wizard(TOKEN_DETAILS_SCENE_ID)
export class TokenDetailsScene {
    private readonly logger = new Logger(TokenDetailsScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Entering ${TOKEN_DETAILS_SCENE_ID}, step 1: askMintAddress, session: ${JSON.stringify(ctx.session)}`);

            // Initialize session if undefined
            ctx.session = ctx.session || {};
            ctx.session.__scenes = ctx.session.__scenes || {
                cursor: 0,
                current: TOKEN_DETAILS_SCENE_ID,
                state: {}
            };

            const { mintAddress } = ctx.wizard.state;
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                await this.handleMintAddressWithMint(ctx, mintAddress);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup }
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
        }
    }

    @WizardStep(2)
    async handleMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${TOKEN_DETAILS_SCENE_ID}, step 2: handleMintAddress, updateType: ${ctx.updateType}, scene: ${ctx.scene.current?.id}, cursor: ${ctx.wizard.cursor}, session: ${JSON.stringify(ctx.session)}`);

            // Handle callback queries
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}, handling in handleMintAddress`);
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
                this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup }
                );
                return;
            }

            await this.handleMintAddressWithMint(ctx, messageText);
        } catch (error) {
            this.logger.error(`Error in handleMintAddress: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    async handleMintAddressWithMint(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }, mintAddress: string) {
        try {
            this.logger.debug(`Processing mint address: ${mintAddress}`);
            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.SEARCHING);

            const token = await this.tokensService.getTokenDetails(mintAddress);

            if (!token) {
                this.logger.debug(`No token details found for mintAddress: ${mintAddress}`);
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_DETAILS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenDetailsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                ctx.session = {};
                return;
            }

            const name = escapeMarkdownV2(token.name || 'Unknown');
            const symbol = escapeMarkdownV2(token.symbol || 'N/A');
            const supply = token.currentSupply.toLocaleString();
            const marketCap = `$${token.marketCap.toLocaleString()}`;
            const price = `$${token.price.toFixed(8)}`;
            const volume24h = `$${token.usdValueVolume24h.toLocaleString()}`;
            const verified = token.verified ? '✅ Yes' : '❌ No';

            const message =
                `<b>${name} (${symbol})</b>\n` +
                `📍 <b>Mint:</b> <code>${token.mintAddress}</code>\n` +
                `💰 <b>Price:</b> ${price}\n` +
                `📈 <b>Market Cap:</b> ${marketCap}\n` +
                `💸 <b>Supply:</b> ${supply}\n` +
                `📊 <b>24h Volume (USD):</b> ${volume24h}\n` +
                `✅ <b>Verified:</b> ${verified}\n` +
                `🏷️ <b>Category:</b> ${escapeMarkdownV2(token.category || 'N/A')}\n` +
                `🐾 <b>Subcategory:</b> ${escapeMarkdownV2(token.subcategory || 'N/A')}`;

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_DETAILS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenDetailsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error processing mint address ${mintAddress}: ${error.message}, stack: ${error.stack}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
            await ctx.scene.leave();
            ctx.session = {};
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback after scene exit: ${data}`);

        try {
            switch (data) {
                case SceneActions.TOKEN_DETAILS_AGAIN:
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup,
                    });
                    await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
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

    private async handleCommand(ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }, command: string) {
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

    @Action(SceneActions.TOKEN_DETAILS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenDetailsWizardState }, session: CustomSession }) {
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
        }
    }
}