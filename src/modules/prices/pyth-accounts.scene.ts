import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';
import { PythAccount } from '../../types';

export const PYTH_ACCOUNTS_SCENE_ID = 'PYTH_ACCOUNTS_SCENE';

interface PythAccountsWizardState {
    productId?: string;
    priceFeedId?: string;
    symbol?: string;
}

@Wizard(PYTH_ACCOUNTS_SCENE_ID)
export class PythAccountsScene {
    private readonly logger = new Logger(PythAccountsScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask filter step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
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

            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data === SceneActions.CANCEL_BUTTON || data === SceneActions.CLOSE_BUTTON) {
                    return;
                }
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
            this.logger.error(`Error in handle filter step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.GENERIC,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    async handleFetch(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }, params: any) {
        try {
            if (ctx.updateType === 'callback_query') {
                await ctx.answerCbQuery('🔍 Searching...');
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.SEARCHING);

            const accounts = await this.pricesService.getPythAccounts(params);

            if (!accounts || accounts.length === 0) {
                await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.NO_RESULTS, {
                    reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                });
                await ctx.scene.leave();
                return;
            }

            const message = accounts
                .slice(0, 10)
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
                .join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error fetching Pyth accounts: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_ACCOUNTS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.FETCH_ALL)
    async fetchAll(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
        try {
            await ctx.answerCbQuery('📈 Fetching all Pyth accounts...');
            await this.handleFetch(ctx, {});
        } catch (error) {
            this.logger.error(`Error in fetch all action: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.PYTH_ACCOUNTS_AGAIN)
    async filterAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askFilter(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
        return;
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythAccountsWizardState } }) {
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
