import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { KnownAccountsService } from './known-accounts.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse } from '../../utils';

export const TOKEN_BALANCES_SCENE_ID = 'TOKEN_BALANCES_SCENE';

@Wizard(TOKEN_BALANCES_SCENE_ID)
export class TokenBalancesScene {
    private readonly logger = new Logger(TokenBalancesScene.name);

    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardService
    ) { }

    @WizardStep(1)
    async askAddress(@Ctx() ctx: WizardContext) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_BALANCES.ASK_ADDRESS,
                { reply_markup: this.keyboard.getTokenBalancesKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleAddress(@Ctx() ctx: WizardContext) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenBalancesKeyboard().reply_markup }
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES.SEARCHING);

            const response = await this.knownAccountsService.getTokenBalances(messageText);

            if (!response.data || response.data.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_BALANCES.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenBalancesResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = response.data
                .slice(0, 10)
                .map((token, i) => {
                    return (
                        `<b>${i + 1}. ${token.name} (${token.symbol})</b>\n` +
                        `📍 <b>Address:</b> <code>${token.mintAddress}</code>\n` +
                        `💰 <b>Amount:</b> ${token.amount}\n` +
                        `💵 <b>Value (USD):</b> $${token.valueUsd}\n` +
                        `📈 <b>1d Change:</b> ${token.valueUsd1dChange}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_BALANCES.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenBalancesResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle address step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_BALANCES_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKEN_BALANCES_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext) {
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