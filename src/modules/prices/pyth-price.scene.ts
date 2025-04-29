import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { PythPrice, PythPriceError } from '../../types';

export const PYTH_PRICE_SCENE_ID = 'PYTH_PRICE_SCENE';

interface PythPriceWizardState {
    priceFeedId?: string;
}

@Wizard(PYTH_PRICE_SCENE_ID)
export class PythPriceScene {
    private readonly logger = new Logger(PythPriceScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askPriceFeedId(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE.ASK_PRICE_FEED_ID, {
                reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask price feed ID step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handlePriceQuery(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.priceFeedId = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE.SEARCHING);

            const response = await this.pricesService.getPythPrice(messageText);

            if ('code' in response && 'message' in response) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRICE.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const priceData = response as PythPrice;
            const message = (
                `<b>Price Feed Account:</b> <code>${priceData.priceFeedAccount}</code>\n` +
                `💸 <b>Price:</b> ${priceData.price}\n` +
                `📊 <b>Confidence:</b> ${priceData.confidence}\n` +
                `⏰ <b>Last Updated:</b> ${new Date(priceData.lastUpdated * 1000).toUTCString()}\n` +
                `🎰 <b>Valid Slot:</b> ${priceData.validSlot}\n` +
                `📈 <b>1H EMAC:</b> ${priceData.emac1H}\n` +
                `📉 <b>1H EMAP:</b> ${priceData.emap1H}`
            );

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_PRICE.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle price query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_PRICE_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.PYTH_PRICE_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askPriceFeedId(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythPriceWizardState } }) {
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