import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { WizardContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from '../shared/keyboard.service';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { ALERTS_SCENE_ID } from './alerts.scene';
import { BOT_MESSAGES } from '../../constants';
import { Markup } from 'telegraf';

interface AlertsWizardState {
    action?: 'add' | 'view' | 'update' | 'delete' | 'toggle';
    mintAddress?: string;
    targetPrice?: number;
    selectedAlertId?: number;
}

@Update()
export class AlertsUpdate {
    private readonly logger = new Logger(AlertsUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Action('VIEW_ALERTS')
    async onViewAlerts(@Ctx() ctx: WizardContext) {
        try {
            await ctx.answerCbQuery('🔍 Loading your alerts...');
            
            // Make sure to leave any current scene first
            if (ctx.scene.current) {
                await ctx.scene.leave();
            }
            
            // Enter the alerts scene and set action to view
            await ctx.scene.enter(ALERTS_SCENE_ID);
            ctx.wizard.state['action'] = 'view';
            await ctx.wizard.selectStep(5);
        } catch (error) {
            this.logger.error(`Error viewing alerts: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('ADD_ALERT')
    async onAddAlert(@Ctx() ctx: WizardContext) {
        try {
            await ctx.answerCbQuery('➕ Adding new alert...');
            this.logger.debug('Handling ADD_ALERT action button click');
            
            // First leave any current scene
            if (ctx.scene.current) {
                await ctx.scene.leave();
            }
            
            // Enter the alerts scene with a fresh state
            await ctx.scene.enter(ALERTS_SCENE_ID);
            
            // Initialize the state and go directly to step 3
            ctx.wizard.state['action'] = 'add';
            ctx.wizard.selectStep(3);
            
            // Show the mint address prompt immediately
            await ctx.replyWithHTML(
                '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                { 
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                    ]).reply_markup 
                }
            );
        } catch (error) {
            this.logger.error(`Error adding alert: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.ALERTS_MENU)
    async onAlertsMenu(@Ctx() ctx: WizardContext) {
        try {
            await ctx.answerCbQuery('🔔 Accessing alerts menu...');
            
            // Make sure to leave any current scene first
            if (ctx.scene.current) {
                await ctx.scene.leave();
            }
            
            await ctx.scene.enter(ALERTS_SCENE_ID);
            await ctx.wizard.selectStep(1);
        } catch (error) {
            this.logger.error(`Error accessing alerts menu: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Alerts)
    async handleAlerts(@Ctx() ctx: WizardContext) {
        try {
            // Make sure to leave any current scene first
            if (ctx.scene.current) {
                await ctx.scene.leave();
            }
            
            await ctx.scene.enter(ALERTS_SCENE_ID);
            await ctx.wizard.selectStep(1);
        } catch (error) {
            this.logger.error(`Error handling alerts command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }
}