import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { Market } from '../../types';

export const MARKETS_SCENE_ID = 'MARKETS_SCENE';

interface MarketsWizardState {
    programId?: string;
    page?: number;
    limit?: number;
}

@Wizard(MARKETS_SCENE_ID)
export class MarketsScene {
    private readonly logger = new Logger(MarketsScene.name);

    constructor(
        private readonly marketsService: MarketsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askProgramId(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.ASK_PROGRAM_ID, {
                reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask program ID step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleProgramId(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.programId = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.ASK_PAGE, {
                reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in handle program ID step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async handlePage(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const page = parseInt(messageText, 10);
            if (messageText && (isNaN(page) || page < 0)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_PAGE,
                    { reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.page = page >= 0 ? page : 0;

            await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.ASK_LIMIT, {
                reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in handle page step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async handleLimit(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            const limit = parseInt(messageText, 10);
            if (messageText && (isNaN(limit) || limit < 0)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_LIMIT,
                    { reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.limit = limit >= 0 ? limit : 10;

            await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.SEARCHING);

            const markets = await this.marketsService.getMarkets({
                programId: ctx.wizard.state.programId!,
                page: ctx.wizard.state.page,
                limit: ctx.wizard.state.limit,
            });

            if (!markets || markets.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.MARKETS.NO_RESULTS,
                    { reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = markets
                .slice(0, 5) // Limit to 5 markets for display
                .map((market: Market, i: number) => (
                    `<b>${i + 1}. ${escapeMarkdownV2(market.marketName)}</b>\n` +
                    `🆔 <b>Market ID:</b> ${escapeMarkdownV2(market.marketId)}\n` +
                    `<b>Program:</b> ${escapeMarkdownV2(market.programName)} (${escapeMarkdownV2(market.programId)})\n` +
                    `<b>Base Token:</b> ${escapeMarkdownV2(market.baseTokenName)} (${escapeMarkdownV2(market.baseTokenSymbol)})\n` +
                    `<b>Quote Token:</b> ${escapeMarkdownV2(market.quoteTokenName)} (${escapeMarkdownV2(market.quoteTokenSymbol)})\n` +
                    `<b>Updated At:</b> ${new Date(market.updatedAt * 1000).toISOString()}\n`
                ))
                .join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.MARKETS.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getMarketsResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle limit step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.MARKETS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.MARKETS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askProgramId(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: MarketsWizardState } }) {
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