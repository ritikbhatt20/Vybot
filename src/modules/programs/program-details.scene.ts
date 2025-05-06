import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress, isValidSolanaAddress } from '../../utils';
import { ProgramDetailsWizardState } from '../../types';

export const PROGRAM_DETAILS_SCENE_ID = 'PROGRAM_DETAILS_SCENE';

@Wizard(PROGRAM_DETAILS_SCENE_ID)
export class ProgramDetailsScene {
    private readonly logger = new Logger(ProgramDetailsScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askProgramAddress(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
        try {
            const { programAddress } = ctx.scene.state as { programAddress?: string };
            this.logger.debug(`Scene state programAddress: ${programAddress}`);

            if (programAddress && isValidSolanaAddress(programAddress)) {
                ctx.wizard.state.programAddress = programAddress;
                await this.handleProgramDetailsQuery(ctx);
            } else {
                this.logger.debug('No valid programAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_DETAILS.ASK_PROGRAM_ADDRESS,
                    { reply_markup: this.keyboard.getProgramDetailsKeyboard().reply_markup }
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask program address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleProgramDetailsQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
        try {
            if (!ctx.wizard.state.programAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided program address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getProgramDetailsKeyboard().reply_markup }
                    );
                    return;
                }
                ctx.wizard.state.programAddress = messageText;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_DETAILS.SEARCHING);

            const program = await this.programsService.getProgramDetails(ctx.wizard.state.programAddress);

            if (!program) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_DETAILS.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramDetailsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const programId = formatAddress(program.programId);
            const name = program.name || 'N/A';
            const friendlyName = program.friendlyName || 'N/A';
            const entityName = program.entityName || 'N/A';
            const labels = program.labels && program.labels.length > 0 ? program.labels.join(', ') : 'None';
            const dau = program.dau.toLocaleString();
            const transactions1d = program.transactions1d.toLocaleString();
            const instructions1d = program.instructions1d.toLocaleString();
            const newUsersChange1d = program.newUsersChange1d >= 0 ? `+${program.newUsersChange1d}` : program.newUsersChange1d;
            const description = program.programDescription || 'No description available';
            const idlUrl = program.idlUrl || 'N/A';
            const logoUrl = program.logoUrl || 'N/A';

            const message = (
                `<b>Program Details</b>\n\n` +
                `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                `📛 <b>Name:</b> ${name}\n` +
                `🏷️ <b>Friendly Name:</b> ${friendlyName}\n` +
                `🏢 <b>Entity:</b> ${entityName}\n` +
                `🏷️ <b>Labels:</b> ${labels}\n` +
                `👥 <b>Daily Active Users:</b> ${dau}\n` +
                `📈 <b>Transactions (1d):</b> ${transactions1d}\n` +
                `🛠️ <b>Instructions (1d):</b> ${instructions1d}\n` +
                `📊 <b>New Users Change (1d):</b> ${newUsersChange1d}\n` +
                `📝 <b>Description:</b> ${description}\n` +
                `🔗 <b>IDL URL:</b> ${idlUrl}\n` +
                `🖼️ <b>Logo URL:</b> ${logoUrl}\n`
            );

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAM_DETAILS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramDetailsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle program details query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAM_DETAILS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.PROGRAM_DETAILS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askProgramAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramDetailsWizardState } }) {
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
