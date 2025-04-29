import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { PythProduct, PythPriceError } from '../../types';

export const PYTH_PRODUCT_SCENE_ID = 'PYTH_PRODUCT_SCENE';

interface PythProductWizardState {
    productId?: string;
}

@Wizard(PYTH_PRODUCT_SCENE_ID)
export class PythProductScene {
    private readonly logger = new Logger(PythProductScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askProductId(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRODUCT.ASK_PRODUCT_ID, {
                reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup,
            });
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask product ID step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleProductQuery(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.productId = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRODUCT.SEARCHING);

            const product = await this.pricesService.getPythProduct(messageText);

            if ('code' in product && 'message' in product) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.PYTH_PRODUCT.NO_RESULTS,
                    { reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = [
                `📌 <b>Product ID:</b> <code>${product.productId}</code>`,
                `📝 <b>Description:</b> ${product.description}`,
                `💱 <b>Symbol:</b> ${product.symbol}`,
                `📊 <b>Asset Type:</b> ${product.assetType}`,
                `💵 <b>Quote:</b> ${product.quote}`,
                `⚖️ <b>Base:</b> ${product.base}`,
                `📅 <b>Schedule:</b> ${product.schedule}`,
                `🔖 <b>Generic Symbol:</b> ${product.genericSymbol}`,
            ].join('\n');

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.PYTH_PRODUCT.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle product query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.PYTH_PRODUCT_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.PYTH_PRODUCT_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askProductId(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: PythProductWizardState } }) {
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