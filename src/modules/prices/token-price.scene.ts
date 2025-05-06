import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { PricesService } from './prices.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';

export const TOKEN_PRICE_SCENE_ID = 'TOKEN_PRICE_SCENE';

interface TokenPriceWizardState {
    mintAddress?: string;
}

@Wizard(TOKEN_PRICE_SCENE_ID)
export class TokenPriceScene {
    private readonly logger = new Logger(TokenPriceScene.name);

    constructor(
        private readonly pricesService: PricesService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
        try {
            const { mintAddress } = ctx.wizard.state;
            this.logger.debug(`Scene state: ${JSON.stringify(ctx.wizard.state)}`);

            if (mintAddress && isValidSolanaAddress(mintAddress)) {
                await this.handlePriceQuery(ctx);
            } else {
                await ctx.replyWithHTML(BOT_MESSAGES.PRICES.TOKEN_PRICE.ASK_MINT_ADDRESS, {
                    reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup,
                });
                ctx.wizard.next();
            }
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handlePriceQuery(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
        try {
            if (!ctx.wizard.state.mintAddress) {
                const messageText = (ctx.message as { text: string })?.text;
                if (!messageText || !isValidSolanaAddress(messageText)) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup }
                    );
                    return;
                }
                ctx.wizard.state.mintAddress = messageText;
            }

            const mintAddress = ctx.wizard.state.mintAddress;
            await ctx.replyWithHTML(BOT_MESSAGES.PRICES.TOKEN_PRICE.SEARCHING);

            const tokenPriceData = await this.pricesService.getTokenPrice(mintAddress);

            if (!tokenPriceData) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.TOKEN_PRICE.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenPriceResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const { name, symbol, currentPrice } = tokenPriceData;
            const escapedName = escapeMarkdownV2(name || 'Unknown');
            const escapedSymbol = escapeMarkdownV2(symbol || 'N/A');
            const price = `$${currentPrice.toFixed(8)}`;

            const message = (
                `<b>${escapedName} (${escapedSymbol})</b>\n\n` +
                `📍 <b>Mint:</b> <code>${mintAddress}</code>\n` +
                `💲 <b>Current Price:</b> <b>${price}</b>\n`
            );

            await ctx.replyWithHTML(`${BOT_MESSAGES.PRICES.TOKEN_PRICE.RESULTS_HEADER}${message}`, {
                reply_markup: this.keyboard.getTokenPriceResultsKeyboard().reply_markup,
            });

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle price query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_PRICE_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKEN_PRICE_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: TokenPriceWizardState } }) {
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