import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { KeyboardService } from '../shared/keyboard.service';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { Context } from '../shared/interfaces/context.interface';
import { Logger } from '@nestjs/common';
import { BOT_MESSAGES } from '../../constants';
import { PatternAlert } from './entities/pattern-alert.entity';
import { SceneActions } from '../../enums/actions.enum';

export const PATTERN_ALERTS_SCENE_ID = 'pattern-alerts';

interface PatternAlertsContext extends Context {
    scene: {
        enter: (sceneName: string) => Promise<void>;
        leave: () => Promise<void>;
    };
    match: RegExpExecArray | null;
}

@Scene(PATTERN_ALERTS_SCENE_ID)
export class PatternAlertsScene {
    private readonly logger = new Logger(PatternAlertsScene.name);

    constructor(
        private readonly keyboardService: KeyboardService,
        private readonly patternRecognitionService: PatternRecognitionService,
    ) {}

    private formatPatternName(pattern: string): string {
        return pattern
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: PatternAlertsContext) {
        await this.displayAlerts(ctx);
    }

    private async displayAlerts(ctx: PatternAlertsContext) {
        try {
            const alerts = await this.patternRecognitionService.getUserPatternAlerts(ctx.from.id);
            
            if (alerts.length === 0) {
                await ctx.reply(
                    '📭 You have no pattern alerts set up.',
                    { reply_markup: this.keyboardService.getPatternAlertsListKeyboard().reply_markup }
                );
                return;
            }

            // Create buttons for each alert
            const buttons = alerts.map(alert => {
                const pattern = alert.patterns[0]; // Get first pattern for preview
                return [{
                    text: `${this.formatPatternName(pattern)} - ${alert.timeframe.toUpperCase()}`,
                    callback_data: `view_alert:${alert.id}`
                }];
            });

            // Add back buttons
            buttons.push([{ text: '➕ Create New Alert', callback_data: 'create_new_alert' }]);
            buttons.push([{ text: '🏠 Back to Main Menu', callback_data: SceneActions.MAIN_MENU_BUTTON }]);

            await ctx.reply(
                '📋 Your Pattern Alerts:\nClick on an alert to view details and manage it.',
                {
                    reply_markup: this.keyboardService.createInlineKeyboard(buttons),
                }
            );
        } catch (error) {
            this.logger.error(`Error displaying pattern alerts: ${error.message}`);
            await ctx.reply(
                '❌ Error fetching pattern alerts. Please try again.',
                { reply_markup: this.keyboardService.getPatternAlertsListKeyboard().reply_markup }
            );
        }
    }

    @Action(/^toggle_pattern_alert:(.+)$/)
    async onToggleAlert(@Ctx() ctx: PatternAlertsContext) {
        try {
            if (!ctx.match || !ctx.callbackQuery?.message) {
                throw new Error('Invalid callback data');
            }
            const alertId = ctx.match[1];
            const messageText = ctx.callbackQuery.message as { text: string };
            const alert = await this.patternRecognitionService.togglePatternAlert(
                alertId,
                !messageText.text.includes('🟢 Active')
            );

            await ctx.answerCbQuery(
                `Alert ${alert.isActive ? 'activated' : 'deactivated'} successfully!`
            );
            await this.displayAlerts(ctx);
        } catch (error) {
            this.logger.error(`Error toggling pattern alert: ${error.message}`);
            await ctx.answerCbQuery('❌ Error toggling alert status');
        }
    }

    @Action(/^delete_pattern_alert:(.+)$/)
    async onDeleteAlert(@Ctx() ctx: PatternAlertsContext) {
        try {
            if (!ctx.match) {
                throw new Error('Invalid callback data');
            }
            const alertId = ctx.match[1];
            await this.patternRecognitionService.deletePatternAlert(alertId);
            await ctx.answerCbQuery('✅ Alert deleted successfully!');
            await this.displayAlerts(ctx);
        } catch (error) {
            this.logger.error(`Error deleting pattern alert: ${error.message}`);
            await ctx.answerCbQuery('❌ Error deleting alert');
        }
    }

    @Action(/^view_alert:(.+)$/)
    async onViewAlert(@Ctx() ctx: PatternAlertsContext) {
        try {
            if (!ctx.match) {
                throw new Error('Invalid callback data');
            }
            const alertId = ctx.match[1];
            const alert = await this.patternRecognitionService.getPatternAlert(alertId);
            
            if (!alert) {
                await ctx.answerCbQuery('❌ Alert not found');
                return;
            }

            const patterns = alert.patterns.map(p => this.formatPatternName(p)).join(', ');
            const message = `🔔 *Pattern Alert Details*\n` +
                `*Token:* \`${alert.tokenAddress}\`\n` +
                `*Pattern(s):* ${patterns}\n` +
                `*Timeframe:* ${alert.timeframe.toUpperCase()}\n` +
                `*Confidence:* ${alert.confidence}%\n` +
                `*Status:* ${alert.isActive ? '🟢 Active' : '🔴 Inactive'}\n` +
                `*ID:* \`${alert.id}\`\n`;

            await ctx.editMessageText(
                message,
                {
                    parse_mode: 'Markdown',
                    reply_markup: this.keyboardService.getPatternAlertActionsKeyboard(alert.id).reply_markup,
                }
            );
        } catch (error) {
            this.logger.error(`Error viewing alert: ${error.message}`);
            await ctx.answerCbQuery('❌ Error viewing alert details');
        }
    }

    @Action('create_new_alert')
    async onCreateNewAlert(@Ctx() ctx: PatternAlertsContext) {
        try {
            await ctx.answerCbQuery();
            await ctx.scene.leave();
            await ctx.scene.enter('pattern-recognition');
        } catch (error) {
            this.logger.error(`Error creating new alert: ${error.message}`);
            await ctx.answerCbQuery('❌ Error creating new alert');
        }
    }

    @Action('back_to_alerts_list')
    async onBackToAlertsList(@Ctx() ctx: PatternAlertsContext) {
        try {
            await ctx.answerCbQuery();
            await this.displayAlerts(ctx);
        } catch (error) {
            this.logger.error(`Error returning to alerts list: ${error.message}`);
            await ctx.answerCbQuery('❌ Error returning to alerts list');
        }
    }

    @Action(SceneActions.PATTERN_ALERTS)
    async onPatternAlerts(@Ctx() ctx: PatternAlertsContext) {
        await ctx.answerCbQuery('📋 Opening your pattern alerts...');
        await ctx.scene.enter(PATTERN_ALERTS_SCENE_ID);
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    @Action('back_to_main')
    async onBackToMain(@Ctx() ctx: PatternAlertsContext) {
        try {
            await ctx.answerCbQuery();
            await ctx.scene.leave();
            await ctx.replyWithHTML(
                BOT_MESSAGES.MAIN_MENU,
                { reply_markup: this.keyboardService.getMainKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error returning to main menu: ${error.message}`);
            await ctx.answerCbQuery('❌ Error returning to main menu');
        }
    }
} 