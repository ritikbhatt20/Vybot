import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress } from '../../utils';
import { ProgramTxCountWizardState } from '../../types';

export const PROGRAM_TX_COUNT_SCENE_ID = 'PROGRAM_TX_COUNT_SCENE';

@Wizard(PROGRAM_TX_COUNT_SCENE_ID)
export class ProgramTxCountScene {
    private readonly logger = new Logger(ProgramTxCountScene.name);

    private readonly rangeMap: { [key: string]: string } = {
        '4h': '4h',
        '12h': '12h',
        '24h': '24h',
        '1d': '1d',
        '7d': '7d',
        '30d': '30d',
    };

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askProgramAddress(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_TX_COUNT.ASK_PROGRAM_ADDRESS,
                { reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask program address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askRange(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.programAddress = messageText;
            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_TX_COUNT.ASK_RANGE,
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
        }
    }

    @WizardStep(3)
    async handleTxCountQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        try {
            let range = (ctx.message as { text: string })?.text;
            if (ctx.updateType === 'callback_query') {
                range = (ctx.callbackQuery as any).data.split(':')[1];
                await ctx.answerCbQuery();
            }

            if (!range || !Object.values(this.rangeMap).includes(range)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_RANGE,
                    { reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.range = range;

            const { programAddress } = ctx.wizard.state;

            if (!programAddress) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup }
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_TX_COUNT.SEARCHING);

            const txCounts = await this.programsService.getProgramTxCount(programAddress, range);

            if (!txCounts || txCounts.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_TX_COUNT.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramTxCountResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = txCounts
                .map((txCount, i) => {
                    const date = new Date(txCount.blockTime * 1000).toISOString().split('T')[0];
                    const count = txCount.transactionsCount.toLocaleString();
                    const programId = txCount.programId;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `📈 <b>Transaction Count:</b> ${count}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAM_TX_COUNT.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramTxCountResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle tx count query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAM_TX_COUNT_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action('range:4h')
    @Action('range:12h')
    @Action('range:24h')
    @Action('range:1d')
    @Action('range:7d')
    @Action('range:30d')
    async handleRangeSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        await this.handleTxCountQuery(ctx);
    }

    @Action(SceneActions.PROGRAM_TX_COUNT_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askProgramAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramTxCountWizardState } }) {
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