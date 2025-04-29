import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';
import { DexAmmProgram } from '../../types';

export const DEX_AMM_SCENE_ID = 'DEX_AMM_SCENE';

interface DexAmmWizardState { }

@Wizard(DEX_AMM_SCENE_ID)
export class DexAmmScene {
    private readonly logger = new Logger(DexAmmScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async fetchPrograms(@Ctx() ctx: WizardContext & { wizard: { state: DexAmmWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.DEX_AMM.SEARCHING);

            const programs = await this.pricesService.getDexAmmPrograms();

            if (!programs || programs.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.DEX_AMM.NO_RESULTS,
                    { reply_markup: this.keyboard.getDexAmmResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = programs
                .slice(0, 10) // Limit to 10 programs for display
                .map((program, i) => (
                    `<b>${i + 1}. <code>${program.programName}</code></b>\n` +
                    `🆔 <b>Program ID:</b> <code>${program.programId}</code>\n`
                ))
                .join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.DEX_AMM.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getDexAmmResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in fetch programs step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Fetch Again', action: SceneActions.DEX_AMM_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.DEX_AMM_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: DexAmmWizardState } }) {
        await ctx.answerCbQuery("Let's fetch again");
        ctx.wizard.selectStep(1);
        await this.fetchPrograms(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: DexAmmWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: DexAmmWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: DexAmmWizardState } }) {
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