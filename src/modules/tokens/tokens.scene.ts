import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, escapeMarkdownV2 } from '../../utils';

export const TOKENS_SCENE_ID = 'TOKENS_SCENE';

@Wizard(TOKENS_SCENE_ID)
export class TokensScene {
    private readonly logger = new Logger(TokensScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKENS.ASK_FILTER,
                { reply_markup: this.keyboard.getTokensKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask filter step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.FETCH_ALL)
    async fetchAll(@Ctx() ctx: WizardContext) {
        try {
            await ctx.answerCbQuery('📊 Fetching all tokens...');
            await this.handleFetch(ctx, {});
        } catch (error) {
            this.logger.error(`Error in fetch all action: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext) {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data === SceneActions.CANCEL_BUTTON || data === SceneActions.CLOSE_BUTTON) {
                    return;
                }
            }

            const messageText = (ctx.message as { text: string })?.text;
            let params: any = {};

            if (messageText && messageText !== SceneActions.FETCH_ALL) {
                try {
                    const pairs = messageText.split(',').map((p) => p.trim().split('='));
                    pairs.forEach(([key, value]) => {
                        if (key === 'limit' || key === 'page') {
                            params[key] = parseInt(value, 10);
                        } else {
                            params[key] = value;
                        }
                    });
                } catch (error) {
                    this.logger.warn(`Invalid filter format: ${messageText}`);
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_FORMAT,
                        { reply_markup: this.keyboard.getTokensKeyboard().reply_markup }
                    );
                    return;
                }
            }

            await this.handleFetch(ctx, params);
        } catch (error) {
            this.logger.error(`Error in handle filter step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.GENERIC,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKENS_AGAIN }],
            });
        }
    }

    async handleFetch(@Ctx() ctx: WizardContext, params: any) {
        try {
            if (ctx.updateType === 'callback_query') {
                await ctx.answerCbQuery('🔍 Searching...');
            }

            await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.SEARCHING);

            const tokens = await this.tokensService.getTokens(params);

            if (!tokens || tokens.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKENS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokensResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = tokens
                .slice(0, 10)
                .map((token, i) => {
                    const name = escapeMarkdownV2(token.name || 'Unnamed Token');
                    const symbol = escapeMarkdownV2(token.symbol || 'N/A');
                    const supply = token.currentSupply ? token.currentSupply.toLocaleString() : 'N/A';
                    const marketCap = token.marketCap ? `$${token.marketCap.toLocaleString()}` : 'N/A';

                    return (
                        `<b>${i + 1}. ${name} (${symbol})</b>\n` +
                        `📍 <b>Mint:</b> <code>${token.mintAddress}</code>\n` +
                        `💰 <b>Supply:</b> ${supply}\n` +
                        `📈 <b>Market Cap:</b> ${marketCap}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKENS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokensResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error fetching tokens: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKENS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKENS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askFilter(ctx);
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
