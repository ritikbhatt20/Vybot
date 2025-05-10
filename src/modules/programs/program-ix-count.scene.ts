import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress } from '../../utils';
import { ProgramIxCountWizardState } from '../../types';

export const PROGRAM_IX_COUNT_SCENE_ID = 'PROGRAM_IX_COUNT_SCENE';

@Wizard(PROGRAM_IX_COUNT_SCENE_ID)
export class ProgramIxCountScene {
    private readonly logger = new Logger(ProgramIxCountScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askProgramAddress(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            const { programAddress } = ctx.wizard.state;
            this.logger.debug(`Scene state: ${JSON.stringify(ctx.wizard.state)}`);

            if (programAddress && isValidSolanaAddress(programAddress)) {
                ctx.wizard.state.programAddress = programAddress;
                await this.askRange(ctx);
            } else {
                this.logger.debug('No valid programAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_IX_COUNT.ASK_PROGRAM_ADDRESS,
                    { reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup }
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask program address step: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @WizardStep(2)
    async askRange(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
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

            if (!ctx.wizard.state.programAddress) {
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided program address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup }
                    );
                    return;
                }
                ctx.wizard.state.programAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_IX_COUNT.ASK_RANGE,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('4 Hours', 'range:4h'),
                            Markup.button.callback('12 Hours', 'range:12h'),
                            Markup.button.callback('24 Hours', 'range:24h'),
                        ],
                        [
                            Markup.button.callback('1 Day', 'range:1d'),
                            Markup.button.callback('7 Days', 'range:7d'),
                            Markup.button.callback('30 Days', 'range:30d'),
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
            this.logger.error(`Error in ask range step: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @WizardStep(3)
    async handleIxCountQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            let range: string | undefined;
            if (ctx.updateType === 'callback_query') {
                range = (ctx.callbackQuery as any).data.split(':')[1];
                await ctx.answerCbQuery();
            } else {
                range = (ctx.message as { text: string })?.text;
            }

            if (!range || !['4h', '12h', '24h', '1d', '7d', '30d'].includes(range)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_RANGE,
                    { reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.range = range;

            const { programAddress } = ctx.wizard.state;

            if (!programAddress) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup }
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_IX_COUNT.SEARCHING);

            const ixCounts = await this.programsService.getProgramIxCount(programAddress, range);

            if (!ixCounts || ixCounts.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_IX_COUNT.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramIxCountResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = ixCounts
                .map((ixCount, i) => {
                    const date = new Date(ixCount.blockTime * 1000).toISOString().split('T')[0];
                    const count = ixCount.instructionsCount.toLocaleString();
                    const programId = ixCount.programId;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `📈 <b>Instruction Count:</b> ${count}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAM_IX_COUNT.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramIxCountResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle ix count query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAM_IX_COUNT_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(/range:(4h|12h|24h|1d|7d|30d)/)
    async handleRangeSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        await this.handleIxCountQuery(ctx);
    }

    @Action(SceneActions.PROGRAM_IX_COUNT_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            ctx.wizard.state = {};
            ctx.session = {};
            ctx.wizard.selectStep(1);
            await this.askProgramAddress(ctx);
        } catch (error) {
            this.logger.error(`Error in tryAgain action: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            await ctx.answerCbQuery('Operation cancelled');
            ctx.wizard.state = {};
            ctx.session = {};
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in onCancel action: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            await ctx.answerCbQuery('Returning to main menu');
            ctx.wizard.state = {};
            ctx.session = {};
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in onMainMenu action: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramIxCountWizardState } }) {
        try {
            ctx.wizard.state = {};
            ctx.session = {};
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in cancel command: ${error.message}`);
            await ctx.scene.leave();
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }
}