import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { KnownAccountsService } from './known-accounts.service';
import { KeyboardsService } from '../shared/keyboard.service';
import { Commands } from 'src/enums/commands.enum';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';

export const KNOWN_ACCOUNTS_SCENE_ID = 'KNOWN_ACCOUNTS_SCENE';

// Define specific scene actions - these need to match exactly what's used in the buttons
const FILTER_AGAIN = 'FILTER_AGAIN';
const CLOSE_BUTTON = 'CLOSE_BUTTON';
const CANCEL_BUTTON = 'CANCEL_BUTTON';
const FETCH_ALL = 'FETCH_ALL';

@Wizard(KNOWN_ACCOUNTS_SCENE_ID)
export class KnownAccountsScene {
    constructor(
        private readonly knownAccountsService: KnownAccountsService,
        private readonly keyboard: KeyboardsService,
    ) { }

    @WizardStep(1)
    async askFilter(@Ctx() ctx: WizardContext) {
        const message = escapeMarkdownV2(
            '📊 Enter a filter (e.g., "labels=DEFI,NFT" or "name=Openbook") or press Fetch to get all known accounts:',
        );
        await ctx.replyWithMarkdownV2(message, {
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('📥 Fetch All', FETCH_ALL)],
                [Markup.button.callback('🚫 Cancel', CANCEL_BUTTON)],
            ]).reply_markup,
        });
        ctx.wizard.next();
    }

    @Action(FETCH_ALL)
    async fetchAll(@Ctx() ctx: WizardContext) {
        await ctx.answerCbQuery('Fetching all accounts...');
        await this.handleFetch(ctx, {});
    }

    // We also need to handle the CANCEL_BUTTON inside the scene to prevent progression
    @Action(CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext) {
        // Important: Remove this handler from the scene to avoid duplicate processing
        // Just answer the callback query and let the global handler take care of the rest
        await ctx.answerCbQuery('Operation cancelled');
        // Stop scene execution - return explicitly to prevent handleFilter from running
        return;
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext) {
        // First check if this is a callback query for actions we want to intercept
        if (ctx.updateType === 'callback_query') {
            const data = (ctx.callbackQuery as any).data;
            if (data === CANCEL_BUTTON || data === CLOSE_BUTTON) {
                // Don't process these in handleFilter
                return;
            }
        }

        const messageText = (ctx.message as { text: string })?.text;
        let params: any = {};

        if (messageText && messageText !== FETCH_ALL) {
            try {
                const pairs = messageText.split(',').map((p) => p.trim().split('='));
                pairs.forEach(([key, value]) => {
                    if (key === 'labels') {
                        params[key] = value.split(',').map((v) => v.trim());
                    } else {
                        params[key] = value;
                    }
                });
            } catch {
                const errorMessage = escapeMarkdownV2(
                    '❌ Invalid filter format. Try "labels=DEFI,NFT" or "name=Openbook":',
                );
                await ctx.replyWithMarkdownV2(errorMessage, {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('📥 Fetch All', FETCH_ALL)],
                        [Markup.button.callback('🚫 Cancel', CANCEL_BUTTON)],
                    ]).reply_markup,
                });
                return;
            }
        }

        await this.handleFetch(ctx, params);
    }

    async handleFetch(@Ctx() ctx: WizardContext, params: any) {
        try {
            if (ctx.updateType === 'callback_query') {
                await ctx.answerCbQuery('🔃 Fetching accounts...');
            } else {
                await ctx.replyWithMarkdownV2(escapeMarkdownV2('🔃 Fetching accounts...'));
            }

            const accounts = await this.knownAccountsService.getKnownAccounts(params);

            if (!accounts || accounts.length === 0) {
                const noAccountsMessage = escapeMarkdownV2('🛑 No accounts found.');
                await ctx.replyWithMarkdownV2(noAccountsMessage, {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 Filter Again', FILTER_AGAIN)],
                        [Markup.button.callback('❌ Close', CLOSE_BUTTON)],
                    ]).reply_markup,
                });
                await ctx.scene.leave();
                return;
            }

            const message = accounts
                .slice(0, 10)
                .map((acc, i) => {
                    return (
                        `*${i + 1}\\. ${escapeMarkdownV2(acc.name || 'Unnamed')}*\n` +
                        `📍 *Address:* \`${escapeMarkdownV2(acc.ownerAddress)}\`\n` +
                        `🏷️ *Labels:* ${escapeMarkdownV2(acc.labels.join(', ') || 'None')}\n` +
                        `🏢 *Entity:* ${escapeMarkdownV2(acc.entity || 'N/A')}\n`
                    );
                })
                .join('\n');

            await ctx.replyWithMarkdownV2(
                `*📊 Known Accounts*\n\n${message}`,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 Filter Again', FILTER_AGAIN)],
                        [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
                        [Markup.button.callback('❌ Close', CLOSE_BUTTON)],
                    ]).reply_markup,
                },
            );
            await ctx.scene.leave();
        } catch (error) {
            console.error('API Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                params,
            });
            const errorMessage =
                error.response?.data?.message || 'Failed to fetch accounts. Please check your API key or try again later.';
            await handleErrorResponses({
                ctx,
                error,
                defaultMessage: errorMessage,
                buttons: [{ text: '🔃 Retry', action: FILTER_AGAIN }],
            });
        }
    }

    // Add this to handle the Cancel command explicitly
    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext) {
        const cancelMessage = escapeMarkdownV2('❌ Operation cancelled.');
        await ctx.replyWithMarkdownV2(cancelMessage, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }
}
