import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { KnownAccountsService } from './known-accounts.service';
import { KeyboardsService } from '../shared/keyboard.service';
import { Commands } from 'src/enums/commands.enum';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';

export const KNOWN_ACCOUNTS_SCENE_ID = 'KNOWN_ACCOUNTS_SCENE';

enum KnownAccountsActions {
    CANCEL = 'CANCEL',
    CLOSE = 'CLOSE',
    FILTER = 'FILTER',
}

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
                [Markup.button.callback('📥 Fetch All', 'FETCH_ALL')],
                [Markup.button.callback('🚫 Cancel', KnownAccountsActions.CANCEL)],
            ]).reply_markup,
        });
        ctx.wizard.next();
    }

    @Action('FETCH_ALL')
    async fetchAll(@Ctx() ctx: WizardContext) {
        await this.handleFetch(ctx, {});
    }

    @WizardStep(2)
    async handleFilter(@Ctx() ctx: WizardContext) {
        const messageText = (ctx.message as { text: string })?.text;
        let params: any = {};

        if (messageText && messageText !== 'FETCH_ALL') {
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
                        [Markup.button.callback('📥 Fetch All', 'FETCH_ALL')],
                        [Markup.button.callback('🚫 Cancel', KnownAccountsActions.CANCEL)],
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
                        [Markup.button.callback('🔄 Filter Again', KnownAccountsActions.FILTER)],
                        [Markup.button.callback('❌ Close', KnownAccountsActions.CLOSE)],
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
                        [Markup.button.callback('🔄 Filter Again', KnownAccountsActions.FILTER)],
                        [Markup.button.url('🔍 More Analytics', 'https://alphavybe.com')],
                        [Markup.button.callback('❌ Close', KnownAccountsActions.CLOSE)],
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
                buttons: [{ text: '🔃 Retry', action: KnownAccountsActions.FILTER }],
            });
        }
    }

    @Action(KnownAccountsActions.FILTER)
    async retryFilter(@Ctx() ctx: WizardContext) {
        try {
            console.log('Retry Filter: Action triggered with callback data:', ctx.callbackQuery?.message);
            await ctx.answerCbQuery('🔄 Preparing to filter again...');
            console.log('Retry Filter: answerCbQuery called, re-entering scene');
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID); // Re-enter scene instead of selectStep
            console.log('Retry Filter: Scene re-entered');
        } catch (error) {
            console.error('Retry Filter Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            const errorMessage = escapeMarkdownV2('❌ Failed to retry filter. Please try /knownaccounts again.');
            await ctx.replyWithMarkdownV2(errorMessage, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        }
    }

    @Action(KnownAccountsActions.CANCEL)
    async cancel(@Ctx() ctx: WizardContext) {
        try {
            console.log('Cancel: Action triggered');
            await ctx.answerCbQuery();
            const cancelMessage = escapeMarkdownV2('❌ Operation cancelled.');
            await ctx.replyWithMarkdownV2(cancelMessage, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
        } catch (error) {
            console.error('Cancel Error:', error.message);
        }
    }

    @Action(KnownAccountsActions.CLOSE)
    async close(@Ctx() ctx: WizardContext) {
        try {
            console.log('Close: Action triggered');
            await ctx.answerCbQuery();
            await ctx.deleteMessage();
            await ctx.scene.leave();
        } catch (error) {
            console.error('Close Error:', error.message);
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext) {
        await ctx.scene.leave();
    }
}