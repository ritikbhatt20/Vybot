import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { KnownAccountsService } from './known-accounts.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { escapeMarkdownV2, handleErrorResponse, formatAddress } from '../../utils';

export const KNOWN_ACCOUNTS_SCENE_ID = 'KNOWN_ACCOUNTS_SCENE';

@Wizard(KNOWN_ACCOUNTS_SCENE_ID)
export class KnownAccountsScene {
    private readonly logger = new Logger(KnownAccountsScene.name);

    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext) {
        try {
            await ctx.replyWithMarkdownV2(
                escapeMarkdownV2(BOT_MESSAGES.KNOWN_ACCOUNTS.ASK_FILTER),
                { reply_markup: this.keyboard.getFilterKeyboard().reply_markup }
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
            await ctx.answerCbQuery('📊 Fetching all accounts...');
            await this.handleFetch(ctx, {});
        } catch (error) {
            this.logger.error(`Error in fetch all action: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Operation cancelled');
        // Important: return to prevent further processing
        return;
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext) {
        try {
            // Check if this is a callback query we want to intercept
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                if (data === SceneActions.CANCEL_BUTTON || data === SceneActions.CLOSE_BUTTON) {
                    return; // Don't process these in handleFilter
                }
            }

            const messageText = (ctx.message as { text: string })?.text;
            let params: any = {};

            if (messageText && messageText !== SceneActions.FETCH_ALL) {
                try {
                    // Parse filter parameters
                    const pairs = messageText.split(',').map((p) => p.trim().split('='));
                    pairs.forEach(([key, value]) => {
                        if (key === 'labels') {
                            params[key] = value.split(',').map((v) => v.trim());
                        } else {
                            params[key] = value;
                        }
                    });
                } catch (error) {
                    this.logger.warn(`Invalid filter format: ${messageText}`);

                    // Handle invalid format
                    await ctx.replyWithMarkdownV2(
                        escapeMarkdownV2(BOT_MESSAGES.ERROR.INVALID_FORMAT),
                        { reply_markup: this.keyboard.getFilterKeyboard().reply_markup }
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
                buttons: [{ text: '🔄 Try Again', action: SceneActions.FILTER_AGAIN }],
            });
        }
    }

    async handleFetch(@Ctx() ctx: WizardContext, params: any) {
        try {
            // Show loading message
            if (ctx.updateType === 'callback_query') {
                await ctx.answerCbQuery('🔍 Searching...');
            }

            await ctx.replyWithMarkdownV2(
                escapeMarkdownV2(BOT_MESSAGES.KNOWN_ACCOUNTS.SEARCHING)
            );

            // Fetch accounts
            const accounts = await this.knownAccountsService.getKnownAccounts(params);

            if (!accounts || accounts.length === 0) {
                await ctx.replyWithMarkdownV2(
                    escapeMarkdownV2(BOT_MESSAGES.KNOWN_ACCOUNTS.NO_RESULTS),
                    { reply_markup: this.keyboard.getResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            // Format results with beautiful formatting
            const message = accounts
                .slice(0, 10)
                .map((acc, i) => {
                    const name = acc.name || 'Unnamed Account';
                    const labels = acc.labels?.length
                        ? acc.labels.join(', ')
                        : 'None';
                    const entity = acc.entity || 'N/A';

                    return (
                        `*${i + 1}\\. ${escapeMarkdownV2(name)}*\n` +
                        `📍 *Address:* \`${escapeMarkdownV2(acc.ownerAddress)}\`\n` +
                        `🏷️ *Labels:* ${escapeMarkdownV2(labels)}\n` +
                        `🏢 *Entity:* ${escapeMarkdownV2(entity)}\n`
                    );
                })
                .join('\n');

            // Show results
            await ctx.replyWithMarkdownV2(
                `${escapeMarkdownV2(BOT_MESSAGES.KNOWN_ACCOUNTS.RESULTS_HEADER)}${message}`,
                {
                    reply_markup: this.keyboard.getResultsKeyboard().reply_markup,
                }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error fetching accounts: ${error.message}`);

            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.FILTER_AGAIN }],
            });

            await ctx.scene.leave();
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext) {
        try {
            await ctx.replyWithMarkdownV2(
                escapeMarkdownV2(BOT_MESSAGES.CANCEL),
                { reply_markup: this.keyboard.getMainKeyboard().reply_markup }
            );
            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in cancel command: ${error.message}`);
            await ctx.scene.leave();
        }
    }
}
