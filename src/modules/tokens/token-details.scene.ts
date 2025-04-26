import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress, escapeMarkdownV2 } from '../../utils';

export const TOKEN_DETAILS_SCENE_ID = 'TOKEN_DETAILS_SCENE';

@Wizard(TOKEN_DETAILS_SCENE_ID)
export class TokenDetailsScene {
    private readonly logger = new Logger(TokenDetailsScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS,
                { reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask mint address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleMintAddress(@Ctx() ctx: WizardContext) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup }
                );
                return;
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.SEARCHING);

            const token = await this.tokensService.getTokenDetails(messageText);

            if (!token) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_DETAILS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenDetailsResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const name = escapeMarkdownV2(token.name || 'Unknown');
            const symbol = escapeMarkdownV2(token.symbol || 'N/A');
            const supply = token.currentSupply.toLocaleString();
            const marketCap = `$${token.marketCap.toLocaleString()}`;
            const price = `$${token.price.toFixed(8)}`;
            const volume24h = `$${token.usdValueVolume24h.toLocaleString()}`;
            const verified = token.verified ? '✅ Yes' : '❌ No';

            const message =
                `<b>${name} (${symbol})</b>\n` +
                `📍 <b>Mint:</b> <code>${formatAddress(token.mintAddress)}</code>\n` +
                `💰 <b>Price:</b> ${price}\n` +
                `📈 <b>Market Cap:</b> ${marketCap}\n` +
                `💸 <b>Supply:</b> ${supply}\n` +
                `📊 <b>24h Volume (USD):</b> ${volume24h}\n` +
                `✅ <b>Verified:</b> ${verified}\n` +
                `🏷️ <b>Category:</b> ${escapeMarkdownV2(token.category || 'N/A')}\n` +
                `🐾 <b>Subcategory:</b> ${escapeMarkdownV2(token.subcategory || 'N/A')}`;

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_DETAILS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenDetailsResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle mint address step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_DETAILS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKEN_DETAILS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askMintAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext) {
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