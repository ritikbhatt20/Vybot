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
import { TokenTransfersWizardState } from '../../types';

export const TOKEN_TRANSFERS_SCENE_ID = 'TOKEN_TRANSFERS_SCENE';

@Wizard(TOKEN_TRANSFERS_SCENE_ID)
export class TokenTransfersScene {
    private readonly logger = new Logger(TokenTransfersScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                ctx.wizard.state.mintAddress = mintAddress;
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
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
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeStart = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.timeEnd = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MIN_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:minAmount')],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask min amount step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(5)
    async askMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            let minAmount: number | undefined;
            if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === 'skip:minAmount') {
                await ctx.answerCbQuery();
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                    );
                    return;
                }
                minAmount = parseInt(messageText);
                ctx.wizard.state.minAmount = minAmount;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MAX_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:maxAmount')],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask max amount step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(6)
    async handleTransfersQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            let localMaxAmount: number | undefined;
            if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === 'skip:maxAmount') {
                await ctx.answerCbQuery();
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }
                localMaxAmount = parseInt(messageText);
                ctx.wizard.state.maxAmount = localMaxAmount;
            }

            const { mintAddress, timeStart, timeEnd, minAmount, maxAmount } = ctx.wizard.state;

            if (!mintAddress || !timeStart || !timeEnd) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
                );
                return;
            }

            if (minAmount && maxAmount && minAmount > maxAmount) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.INVALID_AMOUNT_RANGE,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
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
                maxAmount,
                limit: 10,
                sortByDesc: 'blockTime',
            });

            if (!transfers || transfers.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup },
                );
                await ctx.scene.leave();
                return;
            }

            const message = transfers
                .map((transfer, i) => {
                    const date = new Date(transfer.blockTime * 1000).toISOString().split('T')[0];
                    const amount = parseFloat(transfer.calculatedAmount).toLocaleString();
                    const valueUsd = `$${parseFloat(transfer.valueUsd).toLocaleString()}`;
                    const signature = transfer.signature;
                    const sender = transfer.senderAddress;
                    const receiver = transfer.receiverAddress;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `📜 <b>Signature:</b> <code>${signature}</code>\n` +
                        `➡️ <b>Sender:</b> <code>${sender}</code>\n` +
                        `⬅️ <b>Receiver:</b> <code>${receiver}</code>\n` +
                        `💸 <b>Amount:</b> ${amount}\n` +
                        `💵 <b>Value (USD):</b> ${valueUsd}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_TRANSFERS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle transfers query step: ${error.message}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup },
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
            }
        }
    }

    @Action('skip:minAmount')
    async skipMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await this.askMaxAmount(ctx);
    }

    @Action('skip:maxAmount')
    async skipMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await this.handleTransfersQuery(ctx);
    }

    @Action(SceneActions.TOKEN_TRANSFERS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
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
