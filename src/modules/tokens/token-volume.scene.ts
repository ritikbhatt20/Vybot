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
import { TokenVolumeWizardState } from '../../types';

export const TOKEN_VOLUME_SCENE_ID = 'TOKEN_VOLUME_SCENE';

@Wizard(TOKEN_VOLUME_SCENE_ID)
export class TokenVolumeScene {
    private readonly logger = new Logger(TokenVolumeScene.name);

    private readonly intervalMap: { [key: string]: string } = {
        '1h': 'hour',
        '1d': 'day',
        '1w': 'week',
    };

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        try {
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            this.logger.debug(`Scene state mintAddress: ${mintAddress}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                ctx.wizard.state.mintAddress = mintAddress;
                await this.askStartTime(ctx);
            } else {
                this.logger.debug('No valid mintAddress provided, prompting user');
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_VOLUME.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        try {
            if (!ctx.wizard.state.mintAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    this.logger.warn(`Invalid user-provided mint address: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_VOLUME.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.startTime = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_VOLUME.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askInterval(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.endTime = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_VOLUME.ASK_INTERVAL,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            Markup.button.callback('Hourly', 'interval:1h'),
                            Markup.button.callback('Daily', 'interval:1d'),
                            Markup.button.callback('Weekly', 'interval:1w'),
                        ],
                        [
                            Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON),
                            Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON),
                        ],
                    ]).reply_markup,
                },
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask interval step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(5)
    async handleVolumeQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        try {
            let interval = (ctx.message as { text: string })?.text;
            if (ctx.updateType === 'callback_query') {
                interval = (ctx.callbackQuery as any).data.split(':')[1];
                await ctx.answerCbQuery();
            }

            if (!interval || !['1h', '1d', '1w'].includes(interval)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_INTERVAL,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                return;
            }

            ctx.wizard.state.interval = interval;

            const { mintAddress, startTime, endTime } = ctx.wizard.state;

            if (!mintAddress || !startTime || !endTime) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_VOLUME.SEARCHING);

            const apiInterval = this.intervalMap[interval];

            const volumes = await this.tokensService.getTokenVolumeTimeSeries(mintAddress, {
                startTime,
                endTime,
                interval: apiInterval,
            });

            if (!volumes || volumes.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_VOLUME.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenVolumeResultsKeyboard().reply_markup },
                );
                await ctx.scene.leave();
                return;
            }

            const message = volumes
                .slice(0, 10)
                .map((volume, i) => {
                    const date = new Date(volume.timeBucketStart * 1000).toISOString().split('T')[0];
                    const amount = parseFloat(volume.amount).toLocaleString();
                    const volumeUsd = `$${parseFloat(volume.volume).toLocaleString()}`;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `💸 <b>Amount:</b> ${amount}\n` +
                        `💵 <b>Volume (USD):</b> ${volumeUsd}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_VOLUME.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenVolumeResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle volume query step: ${error.message}`);
            if (error.message.includes('Request time range is too large')) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_VOLUME.TIME_RANGE_TOO_LARGE,
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                ctx.wizard.selectStep(2);
                await this.askStartTime(ctx);
            } else if (error.message.includes('unknown variant')) {
                await ctx.replyWithHTML(
                    '❌ Invalid interval selected. Please choose Hourly, Daily, or Weekly.',
                    { reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup },
                );
                ctx.wizard.selectStep(4);
                await this.askInterval(ctx);
            } else {
                await handleErrorResponse({
                    ctx,
                    error,
                    defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                    buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_VOLUME_AGAIN }],
                });
                await ctx.scene.leave();
            }
        }
    }

    @Action('interval:1h')
    @Action('interval:1d')
    @Action('interval:1w')
    async handleIntervalSelection(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        await this.handleVolumeQuery(ctx);
    }

    @Action(SceneActions.TOKEN_VOLUME_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenVolumeWizardState } }) {
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
