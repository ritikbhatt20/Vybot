import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { KnownAccountsService } from './known-accounts.service';
import { TokenBalanceTimeSeries } from '../../types';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress } from '../../utils';
import { TokenBalancesTsWizardState } from '../../types';

export const TOKEN_BALANCES_TS_SCENE_ID = 'TOKEN_BALANCES_TS_SCENE';

@Wizard(TOKEN_BALANCES_TS_SCENE_ID)
export class TokenBalancesTsScene {
    private readonly logger = new Logger(TokenBalancesTsScene.name);

    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_BALANCES_TS.ASK_ADDRESS,
                { reply_markup: this.keyboard.getTokenBalancesTsKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askDays(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenBalancesTsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.ownerAddress = messageText;

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_BALANCES_TS.ASK_DAYS,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('1 Day', 'days:1'),
                            Markup.button.callback('7 Days', 'days:7'),
                            Markup.button.callback('14 Days', 'days:14'),
                            Markup.button.callback('30 Days', 'days:30'),
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
            this.logger.error(`Error in ask days step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async handleBalancesQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        try {
            let days: number | undefined;
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('days:')) {
                    days = parseInt(data.split(':')[1]);
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText)) || parseInt(messageText) < 1 || parseInt(messageText) > 30) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_DAYS,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('1 Day', 'days:1'),
                                    Markup.button.callback('7 Days', 'days:7'),
                                    Markup.button.callback('14 Days', 'days:14'),
                                    Markup.button.callback('30 Days', 'days:30'),
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
                days = parseInt(messageText);
            }

            ctx.wizard.state.days = days;

            const { ownerAddress, days: queryDays } = ctx.wizard.state;

            // Ensure ownerAddress is defined and valid
            if (!ownerAddress || !isValidSolanaAddress(ownerAddress)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenBalancesTsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES_TS.SEARCHING);

            const balances = await this.knownAccountsService.getTokenBalancesTimeSeries(ownerAddress, queryDays);

            if (!Array.isArray(balances) || balances.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_BALANCES_TS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenBalancesTsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = balances
                .slice(0, 10)
                .map((balance: TokenBalanceTimeSeries, i: number) => {
                    const date = new Date(balance.blockTime * 1000).toISOString().split('T')[0];
                    return (
                        `<b>${i + 1}. Date: ${date}</b>\n` +
                        `💰 <b>Token Value (USD):</b> ${balance.tokenValue}\n` +
                        `🥩 <b>Stake Value (USD):</b> ${balance.stakeValue}\n` +
                        `💸 <b>System Value (USD):</b> ${balance.systemValue}\n` +
                        `🪙 <b>Stake Value (SOL):</b> ${balance.stakeValueSol}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_BALANCES_TS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenBalancesTsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle balances query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_BALANCES_TS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(/days:\d+/)
    async handleDaysSelection(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        await this.handleBalancesQuery(ctx);
    }

    @Action(SceneActions.TOKEN_BALANCES_TS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenBalancesTsWizardState } }) {
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
