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
import { ProgramsWizardState } from '../../types';

export const PROGRAMS_SCENE_ID = 'PROGRAMS_SCENE';

@Wizard(PROGRAMS_SCENE_ID)
export class ProgramsScene {
    private readonly logger = new Logger(ProgramsScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
        try {
            const { programAddress } = ctx.wizard.state;
            this.logger.debug(`Scene state: ${JSON.stringify(ctx.wizard.state)}`);

            if (programAddress && isValidSolanaAddress(programAddress)) {
                ctx.wizard.state.programAddress = programAddress;
                await this.handleProgramsQuery(ctx);
            } else {
                this.logger.debug('No valid programAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAMS.ASK_FILTER,
                    { reply_markup: this.keyboard.getProgramsKeyboard().reply_markup }
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask filter step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleProgramsQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
        try {
            let labels: string[] | undefined;

            if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === SceneActions.FETCH_ALL) {
                await ctx.answerCbQuery();
            } else if (!ctx.wizard.state.programAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (messageText && isValidSolanaAddress(messageText)) {
                    ctx.wizard.state.programAddress = messageText;
                } else if (messageText) {
                    labels = messageText.split(',').map((label) => label.trim().toUpperCase());
                    ctx.wizard.state.labels = labels;
                }
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.SEARCHING);

            const params: { labels?: string[]; limit?: number; sortByDesc?: string; programAddress?: string } = {
                labels: ctx.wizard.state.labels,
                limit: 10,
                sortByDesc: 'dau',
            };

            if (ctx.wizard.state.programAddress) {
                params.programAddress = ctx.wizard.state.programAddress;
            }

            const programs = await this.programsService.getPrograms(params);

            if (!programs || programs.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAMS.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = programs
                .map((program, i) => {
                    const programId = program.programId;
                    const labels = program.labels.filter((label) => label).join(', ') || 'None';
                    const dau = program.dau.toLocaleString();
                    const transactions = program.transactions1d.toLocaleString();
                    const description = program.programDescription || 'No description available';

                    return (
                        `<b>${i + 1}. ${program.name}</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `🏷️ <b>Labels:</b> ${labels}\n` +
                        `👥 <b>Daily Active Users:</b> ${dau}\n` +
                        `📈 <b>Transactions (1d):</b> ${transactions}\n` +
                        `📝 <b>Description:</b> ${description}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAMS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle programs query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAMS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.FETCH_ALL)
    async fetchAll(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
        await this.handleProgramsQuery(ctx);
    }

    @Action(SceneActions.PROGRAMS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askFilter(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramsWizardState } }) {
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