import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress } from '../../utils';
import { TokenTransfersWizardState } from '../../types';

export const TOKEN_TRANSFERS_SCENE_ID = 'TOKEN_TRANSFERS_SCENE';

@Wizard(TOKEN_TRANSFERS_SCENE_ID)
export class TokenTransfersScene {
    private readonly logger = new Logger(TokenTransfersScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async askStartTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.mintAddress = messageText;
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_START_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask start time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async askEndTime(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeStart = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_END_TIME,
                { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask end time step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(4)
    async askMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || isNaN(parseInt(messageText))) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_TIMESTAMP,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.timeEnd = parseInt(messageText);
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MIN_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:minAmount')],
                        [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask min amount step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(5)
    async askMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            let minAmount: number | undefined;
            if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === 'skip:minAmount') {
                await ctx.answerCbQuery();
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }
                minAmount = parseInt(messageText);
                ctx.wizard.state.minAmount = minAmount;
            }

            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MAX_AMOUNT,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('Skip', 'skip:maxAmount')],
                        [Markup.button.callback('🚫 Cancel', SceneActions.CANCEL_BUTTON)],
                    ]).reply_markup,
                }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask max amount step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(6)
    async handleTransfersQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        try {
            let localMaxAmount: number | undefined;
            if (ctx.updateType === 'callback_query' && (ctx.callbackQuery as any).data === 'skip:maxAmount') {
                await ctx.answerCbQuery();
            } else {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || isNaN(parseInt(messageText))) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_AMOUNT,
                        { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                    );
                    return;
                }
                localMaxAmount = parseInt(messageText);
                ctx.wizard.state.maxAmount = localMaxAmount;
            }

            const { mintAddress, timeStart, timeEnd, minAmount, maxAmount } = ctx.wizard.state;

            if (!mintAddress || !timeStart || !timeEnd) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                return;
            }

            if (minAmount && maxAmount && minAmount > maxAmount) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.INVALID_AMOUNT_RANGE,
                    { reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup }
                );
                ctx.wizard.selectStep(4); // Go back to min amount
                await this.askMinAmount(ctx);
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.SEARCHING);

            const transfers = await this.tokensService.getTokenTransfers({
                mintAddress,
                timeStart,
                timeEnd,
                minAmount,
                maxAmount,
                limit: 10, // Limit to 10 for Telegram message size
                sortByDesc: 'blockTime', // Sort by most recent
            });

            if (!transfers || transfers.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_TRANSFERS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = transfers
                .map((transfer, i) => {
                    const date = new Date(transfer.blockTime * 1000).toISOString().split('T')[0];
                    const amount = parseFloat(transfer.calculatedAmount).toLocaleString();
                    const valueUsd = `$${parseFloat(transfer.valueUsd).toLocaleString()}`;
                    const signature = transfer.signature;
                    const sender = transfer.senderAddress;
                    const receiver = transfer.receiverAddress;

                    return (
                        `<b>${i + 1}. ${date}</b>\n` +
                        `📜 <b>Signature:</b> <code>${signature}</code>\n` +
                        `➡️ <b>Sender:</b> <code>${sender}</code>\n` +
                        `⬅️ <b>Receiver:</b> <code>${receiver}</code>\n` +
                        `💸 <b>Amount:</b> ${amount}\n` +
                        `💵 <b>Value (USD):</b> ${valueUsd}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_TRANSFERS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenTransfersResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle transfers query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_TRANSFERS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action('skip:minAmount')
    async skipMinAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await this.askMaxAmount(ctx);
    }

    @Action('skip:maxAmount')
    async skipMaxAmount(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await this.handleTransfersQuery(ctx);
    }

    @Action(SceneActions.TOKEN_TRANSFERS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenTransfersWizardState } }) {
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