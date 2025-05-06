import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress } from '../../utils';
import { TokenHoldersWizardState } from '../../types';

export const TOKEN_HOLDERS_TS_SCENE_ID = 'TOKEN_HOLDERS_TS_SCENE';

@Wizard(TOKEN_HOLDERS_TS_SCENE_ID)
export class TokenHoldersTimeSeriesScene {
    private readonly logger = new Logger(TokenHoldersTimeSeriesScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        try {
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                ctx.wizard.state.mintAddress = mintAddress;
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        try {
            if (!ctx.wizard.state.mintAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.startTime = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async handleHoldersQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.endTime = parseInt(messageText);

            const { mintAddress, startTime, endTime } = ctx.wizard.state;

            if (!mintAddress || !startTime || !endTime) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS_TS.SEARCHING);

            const holders = await this.tokensService.getTokenHoldersTimeSeries(mintAddress, {
                startTime,
                endTime,
                interval: 'day',
            });

            if (!holders || holders.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_HOLDERS_TS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenHoldersTsResultsKeyboard().reply_markup },
                );
                await ctx.scene.leave();
                return;
            }

            const message = holders
                .slice(0, 10)
                .map((holder, i) => {
                    const date = new Date(holder.holdersTimestamp * 1000).toISOString().split('T')[0];
                    const nHolders = holder.nHolders.toLocaleString();

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `👥 <b>Number of Holders:</b> ${nHolders}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_HOLDERS_TS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenHoldersTsResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle holders query step: ${error.message}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_HOLDERS_TS.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup },
                );
                ctx.wizard.selectStep(2);
                await this.askStartTime(ctx);
            } else {
                await handleErrorResponse({
                    ctx,
                    error,
                    defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                    buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_HOLDERS_TS_AGAIN }],
                });
                await ctx.scene.leave();
            }
        }
    }

    @Action(SceneActions.TOKEN_HOLDERS_TS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenHoldersWizardState } }) {
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
