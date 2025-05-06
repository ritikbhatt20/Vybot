import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramRanking } from '../../types';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';
import { ProgramRankingWizardState } from '../../types';

export const PROGRAM_RANKING_SCENE_ID = 'PROGRAM_RANKING_SCENE';

@Wizard(PROGRAM_RANKING_SCENE_ID)
export class ProgramRankingScene {
    private readonly logger = new Logger(ProgramRankingScene.name);

    constructor(
        private readonly programsService: ProgramsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askLimit(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_LIMIT,
                { reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask limit step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askInterval(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            let limit: number | undefined;
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('limit:')) {
                    limit = parseInt(data.split(':')[1]);
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText)) || parseInt(messageText) < 0) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_LIMIT,
                        { reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup }
                    );
                    return;
                }
                limit = parseInt(messageText);
            }

            ctx.wizard.state.limit = limit;

            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_INTERVAL,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('Daily', 'interval:1d'),
                            Markup.button.callback('Weekly', 'interval:7d'),
                            Markup.button.callback('Monthly', 'interval:30d'),
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
            this.logger.error(`Error in ask interval step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askDate(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data.startsWith('interval:')) {
                    ctx.wizard.state.interval = data.split(':')[1] as '1d' | '7d' | '30d';
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!['1d', '7d', '30d'].includes(messageText)) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_INTERVAL,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('Daily', 'interval:1d'),
                                    Markup.button.callback('Weekly', 'interval:7d'),
                                    Markup.button.callback('Monthly', 'interval:30d'),
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
                ctx.wizard.state.interval = messageText as '1d' | '7d' | '30d';
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.PROGRAM_RANKING.ASK_DATE,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Current Date', 'date:current')],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask date step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async handleRankingQuery(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data === 'date:current') {
                    ctx.wizard.state.date = Math.floor(Date.now() / 1000);
                    await ctx.answerCbQuery();
                }
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('Current Date', 'date:current')],
                                [
                                    Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                                    Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                                ],
                            ]).reply_markup,
                        }
                    );
                    return;
                }
                ctx.wizard.state.date = parseInt(messageText);
            }

            const { limit, interval, date } = ctx.wizard.state;

            await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_RANKING.SEARCHING);

            const rankings = await this.programsService.getProgramRanking({
                limit,
                interval,
                date,
            });

            // Ensure rankings is an array
            if (!Array.isArray(rankings) || rankings.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PROGRAM_RANKING.NO_RESULTS,
                    { reply_markup: this.keyboard.getProgramRankingResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = rankings
                .map((ranking: ProgramRanking, i: number) => {
                    const name = escapeMarkdownV2(ranking.programName || 'Unknown Program');
                    const programId = ranking.programId;
                    const score = ranking.score.toFixed(4);
                    const rank = ranking.programRank;

                    return (
                        `<b>${i + 1}. ${name} (Rank ${rank})</b>\n` +
                        `🆔 <b>Program ID:</b> <code>${programId}</code>\n` +
                        `🏆 <b>Score:</b> ${score}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.PROGRAM_RANKING.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getProgramRankingResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle ranking query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PROGRAM_RANKING_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(/limit:\d+/)
    async handleLimitSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.askInterval(ctx);
    }

    @Action(/interval:(1d|7d|30d)/)
    async handleIntervalSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.askDate(ctx);
    }

    @Action('date:current')
    async handleDateSelection(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await this.handleRankingQuery(ctx);
    }

    @Action(SceneActions.PROGRAM_RANKING_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askLimit(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: ProgramRankingWizardState } }) {
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
