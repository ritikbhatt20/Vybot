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

export const TOKEN_HOLDERS_SCENE_ID = 'TOKEN_HOLDERS_SCENE';

@Wizard(TOKEN_HOLDERS_SCENE_ID)
export class TokenHoldersScene {
    private readonly logger = new Logger(TokenHoldersScene.name);

    constructor(
        private readonly tokensService: TokensService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askMintAddress(@Ctx() ctx: WizardContext) {
        try {
            // Check if mintAddress is provided in scene state
            const { mintAddress } = ctx.scene.state as { mintAddress?: string };
            if (mintAddress) {
                // Validate mint address length
                if (mintAddress.length < 32 || mintAddress.length > 44) {
                    await ctx.replyWithHTML(
                        BOT_MESSAGES.ERROR.INVALID_MINT_ADDRESS,
                        { reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup },
                    );
                    ctx.wizard.next();
                    return;
                }
                // Proceed to handleMintAddress logic
                await this.handleMintAddressWithMint(ctx, mintAddress);
            } else {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_HOLDERS.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup },
                );
                ctx.wizard.next();
            }
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
                    { reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup },
                );
                return;
            }

            await this.handleMintAddressWithMint(ctx, messageText);
        } catch (error) {
            this.logger.error(`Error in handle mint address step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_HOLDERS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    async handleMintAddressWithMint(@Ctx() ctx: WizardContext, mintAddress: string) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS.SEARCHING);

            const holders = await this.tokensService.getTopTokenHolders(mintAddress);

            if (!holders || holders.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.TOKEN_HOLDERS.NO_RESULTS,
                    { reply_markup: this.keyboard.getTokenHoldersResultsKeyboard().reply_markup },
                );
                await ctx.scene.leave();
                return;
            }

            const message = holders
                .slice(0, 10)
                .map((holder, i) => {
                    const ownerName = escapeMarkdownV2(holder.ownerName || 'Unknown');
                    const balance = parseFloat(holder.balance).toLocaleString();
                    const valueUsd = parseFloat(holder.valueUsd).toLocaleString();
                    const percentage = (holder.percentageOfSupplyHeld * 100).toFixed(2);

                    return (
                        `<b>${i + 1}. ${ownerName} (Rank ${holder.rank})</b>\n` +
                        `📍 <b>Address:</b> <code>${holder.ownerAddress}</code>\n` +
                        `💰 <b>Balance:</b> ${balance} ${holder.tokenSymbol}\n` +
                        `💵 <b>Value (USD):</b> $${valueUsd}\n` +
                        `📊 <b>Supply Held:</b> ${percentage}%\n`
                    );
                })
                .join('\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.TOKEN_HOLDERS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getTokenHoldersResultsKeyboard().reply_markup },
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error processing mint address ${mintAddress}: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.TOKEN_HOLDERS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.TOKEN_HOLDERS_AGAIN)
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

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
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