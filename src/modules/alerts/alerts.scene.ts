import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions, Actions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';
import { TokenPriceAlert, AlertType, PercentageDirection } from './token-price-alert.entity';

export const ALERTS_SCENE_ID = 'ALERTS_SCENE';

interface AlertsWizardState {
    action?: 'add' | 'view' | 'update' | 'delete' | 'toggle' | 'view_details';
    mintAddress?: string;
    targetPrice?: number;
    selectedAlertId?: number;
    currentAlert?: TokenPriceAlert;
    alertType?: AlertType;
    percentageChange?: number;
    percentageDirection?: PercentageDirection;
}

interface WizardSessionData {
    cursor: number;
    current: string;
    state: AlertsWizardState;
}

interface CustomSession {
    __scenes?: WizardSessionData;
    __menuDisplayed?: boolean;
}

@Wizard(ALERTS_SCENE_ID)
export class AlertsScene {
    private readonly logger = new Logger(AlertsScene.name);

    constructor(
        private readonly alertsService: AlertsService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(0)
    async onSceneEnter(
        @Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }
    ): Promise<void> {
        try {
            const params = ctx.scene.state as { 
                action?: 'add' | 'view' | 'view_details', 
                selectedAlertId?: number 
            };
            const sceneEntryAction = params?.action;
            
            this.logger.debug(`Entering ${ALERTS_SCENE_ID}, params: ${JSON.stringify(params)}, sceneEntryAction: ${sceneEntryAction}`);
            
            if (sceneEntryAction) {
                ctx.wizard.state.action = sceneEntryAction;
                if (params?.selectedAlertId) {
                    ctx.wizard.state.selectedAlertId = params.selectedAlertId;
                }
                
                if (sceneEntryAction === 'add') {
                    this.logger.debug(`onSceneEnter: action 'add', selecting step 3 and prompting for mint address.`);
                    ctx.wizard.selectStep(3);
                    await ctx.replyWithHTML(
                        '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                            ]).reply_markup 
                        }
                    );
                    return;
                } else if (sceneEntryAction === 'view') {
                    this.logger.debug(`onSceneEnter: action 'view', selecting step 5 and calling handleViewAlerts.`);
                    ctx.wizard.selectStep(5);
                    return this.handleViewAlerts(ctx);
                } else if (sceneEntryAction === 'view_details') {
                    if (ctx.wizard.state.selectedAlertId) {
                        this.logger.debug(`onSceneEnter: action 'view_details' for alert ${ctx.wizard.state.selectedAlertId}, selecting step 6 and calling showAlertSettings.`);
                        ctx.wizard.selectStep(6);
                        return this.showAlertSettings(ctx);
                    } else {
                        this.logger.warn(`onSceneEnter: action 'view_details' but no selectedAlertId in state. Falling back to default menu.`);
                    }
                }
                this.logger.debug(`onSceneEnter: Unhandled sceneEntryAction '${sceneEntryAction}', falling through to display main menu.`);
            }
            
            this.logger.debug(`onSceneEnter: Displaying main alerts menu and setting step to 2.`);
            ctx.wizard.state = {};
            
            await ctx.replyWithHTML(
                '🔔 <b>Alerts Menu</b>\n\nSelect the type of alert you want to manage:',
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('🔔 Your Token Price Alerts', 'VIEW_ALERTS')],
                        [Markup.button.callback('➕ Add New', 'ADD_ALERT_DIRECT')],
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                    ]).reply_markup,
                }
            );
            
            ctx.wizard.selectStep(2);
            
        } catch (error) {
            this.logger.error(`Error in onSceneEnter: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(1)
    async dummyStep(@Ctx() ctx: WizardContext) {
        ctx.wizard.next();
    }

    @WizardStep(2)
    async handleMenuSelection(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            this.logger.debug(`Processing ${ALERTS_SCENE_ID}, step 2: handleMenuSelection, updateType: ${ctx.updateType}`);

            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                this.logger.debug(`Callback query received: ${data}`);

                await ctx.answerCbQuery();
                
                if (data === 'VIEW_ALERTS') {
                    this.logger.debug(`[AlertsScene] VIEW_ALERTS: Setting action to 'view' and transitioning to step 5 (handleViewAlerts).`);
                    ctx.wizard.state.action = 'view';
                    ctx.wizard.selectStep(5);
                    return this.handleViewAlerts(ctx);
                }
                
                if (data === 'ADD_ALERT' || data === 'ADD_ALERT_DIRECT') {
                    this.logger.debug('Handling ADD_ALERT in menu selection');
                    
                    ctx.wizard.state = { action: 'add' };
                    
                    await ctx.replyWithHTML(
                        '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                            ]).reply_markup 
                        }
                    );
                    
                    await ctx.wizard.selectStep(3);
                    return;
                }
                
                if (data === 'MAIN_MENU_BUTTON') {
                    await ctx.scene.leave();
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    return;
                }
                
                if (data.startsWith('ALERT_')) {
                    const selectedAlertId = parseInt(data.split('_')[1]);
                    this.logger.debug(`Handling alert selection directly: ${selectedAlertId}`);
                    
                    ctx.wizard.state.selectedAlertId = selectedAlertId;
                    ctx.wizard.state.action = 'view_details';
                    
                    const userId = ctx.from?.id;
                    if (!userId) {
                        throw new Error('User ID not found');
                    }
                    
                    try {
                        this.logger.debug(`Fetching alert ID ${selectedAlertId} for user ${userId}`);
                        const alerts = await this.alertsService.getUserAlerts(userId);
                        
                        if (!alerts || alerts.length === 0) {
                            this.logger.error(`No alerts found for user ${userId}`);
                            await ctx.replyWithHTML(
                                '❌ You don\'t have any alerts. Create one first.',
                                { 
                                    reply_markup: Markup.inlineKeyboard([
                                        [Markup.button.callback('➕ Add New Alert', 'ADD_ALERT')],
                                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                    ]).reply_markup 
                                }
                            );
                            return;
                        }
                        
                        const currentAlert = alerts.find(a => a.id === selectedAlertId);
                        if (!currentAlert) {
                            this.logger.error(`Alert ${selectedAlertId} not found for user ${userId}. Available alerts: ${alerts.map(a => a.id).join(', ')}`);
                            await ctx.replyWithHTML(
                                '❌ Alert not found. It may have been deleted.',
                                { 
                                    reply_markup: Markup.inlineKeyboard([
                                        [Markup.button.callback('🔄 View Your Alerts', 'VIEW_ALERTS')],
                                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                    ]).reply_markup 
                                }
                            );
                            return;
                        }
                        
                        this.logger.debug(`Displaying settings for alert ${currentAlert.id}`);
                        await ctx.replyWithHTML(
                            `⚙️ <b>Price Alert Settings - ${currentAlert.mintAddress.substring(0, 8)}...${currentAlert.mintAddress.substring(currentAlert.mintAddress.length - 4)}</b>\n\n` +
                            `<b>Target Price:</b> $${currentAlert.targetPrice.toFixed(2)}\n` +
                            `<b>Status:</b> ${currentAlert.isActive ? '🟢 Active' : '🔴 Inactive'}`,
                            {
                                reply_markup: Markup.inlineKeyboard([
                                    [Markup.button.callback('💲 Update Price', 'UPDATE_PRICE')],
                                    [Markup.button.callback('🗑️ Delete', 'DELETE_ALERT')],
                                    [Markup.button.callback(
                                        currentAlert.isActive ? '🔴 Deactivate' : '🟢 Activate',
                                        'TOGGLE_STATUS'
                                    )],
                                    [Markup.button.callback('🔄 Back to Alerts', 'VIEW_ALERTS')],
                                    [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                ]).reply_markup,
                            }
                        );
                        
                        await ctx.wizard.selectStep(6);
                    } catch (error) {
                        this.logger.error(`Error showing alert details: ${error.message}`);
                        await ctx.replyWithHTML(
                            '❌ Failed to load alert details. Please try again.',
                            { 
                                reply_markup: Markup.inlineKeyboard([
                                    [Markup.button.callback('🔄 Try Again', 'VIEW_ALERTS')],
                                    [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                ]).reply_markup 
                            }
                        );
                    }
                    return;
                }
                
                await ctx.scene.leave();
                await this.handleCallback(ctx, data);
                return;
            }

            const messageText = (ctx.message as { text: string })?.text;
            if (messageText && messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            await ctx.replyWithHTML(
                '❌ Invalid selection. Please use the buttons to navigate.',
                { 
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 Back to Alerts Menu', 'ALERTS_AGAIN')]
                    ]).reply_markup 
                }
            );
        } catch (error) {
            this.logger.error(`Error in handleMenuSelection: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    @WizardStep(3)
    async handleAddAlertMint(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            if (ctx.updateType !== 'message' || !(ctx.message as any)?.text) {
                if (ctx.updateType === 'callback_query') {
                    const data = (ctx.callbackQuery as any).data;
                    await ctx.answerCbQuery();
                    if (data === 'MAIN_MENU_BUTTON' || data === SceneActions.MAIN_MENU_BUTTON) {
                        await ctx.scene.leave();
                        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                        });
                    }
                }
                return;
            }

            const messageText = (ctx.message as { text: string }).text;
            this.logger.debug(`Processing mint address: ${messageText}`);
            
            if (messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            if (!isValidSolanaAddress(messageText)) {
                this.logger.warn(`Invalid mint address: ${messageText}`);
                await ctx.replyWithHTML(
                    '❌ Invalid mint address format. Please enter a valid Solana token mint address.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                return;
            }

            this.logger.debug(`Valid mint address received: ${messageText}, saving to state`);
            ctx.wizard.state.mintAddress = messageText;
            
            // Ask for alert type
            await ctx.replyWithHTML(
                '📊 <b>Select Alert Type</b>\n\nChoose how you want to be alerted:',
                { 
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('💲 Absolute Price Target', 'ALERT_TYPE_ABSOLUTE')],
                        [Markup.button.callback('📈 Percentage Change', 'ALERT_TYPE_PERCENTAGE')],
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                    ]).reply_markup 
                }
            );
            
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in handleAddAlertMint: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(4)
    async handleAlertTypeSelection(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                await ctx.answerCbQuery();

                if (data === 'ALERT_TYPE_ABSOLUTE') {
                    ctx.wizard.state.alertType = AlertType.ABSOLUTE_PRICE;
                    await ctx.replyWithHTML(
                        '💲 Enter the target price for the alert (in USD):\n\nExample:\n• 147.50',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                            ]).reply_markup 
                        }
                    );
                    ctx.wizard.next();
                    return;
                }

                if (data === 'ALERT_TYPE_PERCENTAGE') {
                    ctx.wizard.state.alertType = AlertType.PERCENTAGE_CHANGE;
                    await ctx.replyWithHTML(
                        '📊 Enter the percentage change for the alert (without % symbol):\n\nExample:\n• 10 (for 10%)',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                            ]).reply_markup 
                        }
                    );
                    ctx.wizard.selectStep(6); // Skip absolute price step
                    return;
                }

                if (data === 'MAIN_MENU_BUTTON') {
                    await ctx.scene.leave();
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    return;
                }
            }

            // Handle any text input as invalid
            await ctx.replyWithHTML(
                '❌ Please use the buttons to select an alert type.',
                { 
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('💲 Absolute Price Target', 'ALERT_TYPE_ABSOLUTE')],
                        [Markup.button.callback('📈 Percentage Change', 'ALERT_TYPE_PERCENTAGE')],
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                    ]).reply_markup 
                }
            );
        } catch (error) {
            this.logger.error(`Error in handleAlertTypeSelection: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(5)
    async handleAddAlertPrice(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            if (ctx.updateType !== 'message' || !(ctx.message as any)?.text) {
                if (ctx.updateType === 'callback_query') {
                    const data = (ctx.callbackQuery as any).data;
                    await ctx.answerCbQuery();
                    if (data === 'MAIN_MENU_BUTTON' || data === SceneActions.MAIN_MENU_BUTTON) {
                        await ctx.scene.leave();
                        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                        });
                    }
                }
                return;
            }

            const messageText = (ctx.message as { text: string }).text;
            this.logger.debug(`Processing price input: ${messageText}`);
            
            if (messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            const { mintAddress } = ctx.wizard.state;
            this.logger.debug(`Current state mintAddress: ${mintAddress}`);
            
            if (!mintAddress) {
                this.logger.warn('Mint address not set, returning to step 3');
                await ctx.replyWithHTML(
                    '🔔 Let\'s start over. Please enter the token mint address first:',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                ctx.wizard.selectStep(3);
                return;
            }

            const targetPrice = parseFloat(messageText);
            this.logger.debug(`Parsed price: ${targetPrice}`);
            
            if (isNaN(targetPrice) || targetPrice <= 0 || targetPrice > 1000000000) {
                this.logger.warn(`Invalid target price: ${messageText}`);
                await ctx.replyWithHTML(
                    '❌ Please enter a valid price between 0 and 1,000,000,000 USD (e.g., 147.50).',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                return;
            }

            const userId = ctx.from?.id;
            if (!userId) {
                throw new Error('User ID not found');
            }

            try {
                this.logger.debug(`Creating alert with mintAddress: ${mintAddress}, price: ${targetPrice}`);
                const alert = await this.alertsService.createAlert(userId, mintAddress, targetPrice);
                this.logger.debug(`Successfully created alert ${alert.id}`);

                await ctx.replyWithHTML(
                    `✅ <b>Price Alert Created!</b>

<b>Token:</b> <code>${mintAddress}</code>
<b>Target Price:</b> $${targetPrice.toFixed(2)}
<b>Status:</b> 🟢 Active

You will be notified when the token price reaches your target.`,
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🔔 View Your Alerts', 'VIEW_ALERTS')],
                            [Markup.button.callback('➕ Add Another Alert', 'ADD_ALERT')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
            } catch (error) {
                this.logger.error(`Error creating alert: ${error.message}`);
                await ctx.replyWithHTML(
                    '❌ There was an error creating your alert. Please try again later.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
            }

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handleAddAlertPrice: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(6)
    async handlePercentageInput(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            if (ctx.updateType !== 'message' || !(ctx.message as any)?.text) {
                if (ctx.updateType === 'callback_query') {
                    const data = (ctx.callbackQuery as any).data;
                    await ctx.answerCbQuery();
                    if (data === 'MAIN_MENU_BUTTON') {
                        await ctx.scene.leave();
                        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                        });
                    }
                    return;
                }
                return;
            }

            const messageText = (ctx.message as { text: string }).text;
            const percentageChange = parseFloat(messageText);

            if (isNaN(percentageChange) || percentageChange <= 0 || percentageChange > 1000) {
                await ctx.replyWithHTML(
                    '❌ Please enter a valid percentage between 0 and 1000 (e.g., 10 for 10%).',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                return;
            }

            ctx.wizard.state.percentageChange = percentageChange;

            await ctx.replyWithHTML(
                '📈 Select the price change direction to monitor:',
                { 
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback('📈 Increase Only', 'DIRECTION_INCREASE')],
                        [Markup.button.callback('📉 Decrease Only', 'DIRECTION_DECREASE')],
                        [Markup.button.callback('📊 Both Directions', 'DIRECTION_BOTH')],
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                    ]).reply_markup 
                }
            );

            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in handlePercentageInput: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(7)
    async handleDirectionSelection(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                await ctx.answerCbQuery();

                if (data === 'MAIN_MENU_BUTTON') {
                    await ctx.scene.leave();
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    return;
                }

                const { mintAddress, percentageChange } = ctx.wizard.state;
                if (!mintAddress || !percentageChange) {
                    throw new Error('Missing required alert data');
                }

                const userId = ctx.from?.id;
                if (!userId) {
                    throw new Error('User ID not found');
                }

                let direction: PercentageDirection;
                let directionText: string;

                switch (data) {
                    case 'DIRECTION_INCREASE':
                        direction = PercentageDirection.INCREASE;
                        directionText = 'increases';
                        break;
                    case 'DIRECTION_DECREASE':
                        direction = PercentageDirection.DECREASE;
                        directionText = 'decreases';
                        break;
                    case 'DIRECTION_BOTH':
                        direction = PercentageDirection.BOTH;
                        directionText = 'changes';
                        break;
                    default:
                        await ctx.replyWithHTML(
                            '❌ Invalid selection. Please use the buttons to choose a direction.',
                            { 
                                reply_markup: Markup.inlineKeyboard([
                                    [Markup.button.callback('📈 Increase Only', 'DIRECTION_INCREASE')],
                                    [Markup.button.callback('📉 Decrease Only', 'DIRECTION_DECREASE')],
                                    [Markup.button.callback('📊 Both Directions', 'DIRECTION_BOTH')],
                                    [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                                ]).reply_markup 
                            }
                        );
                        return;
                }

                const alert = await this.alertsService.createAlert(
                    userId,
                    mintAddress,
                    0, // Default target price for percentage alerts
                    AlertType.PERCENTAGE_CHANGE,
                    percentageChange,
                    direction
                );

                await ctx.replyWithHTML(
                    `✅ <b>Percentage Alert Created!</b>

<b>Token:</b> <code>${mintAddress}</code>
<b>Alert Type:</b> Percentage Change
<b>Trigger:</b> When price ${directionText} by ${percentageChange}%
<b>Status:</b> 🟢 Active

You will be notified when the token price changes by the specified percentage.`,
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🔔 View Your Alerts', 'VIEW_ALERTS')],
                            [Markup.button.callback('➕ Add Another Alert', 'ADD_ALERT')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );

                await ctx.scene.leave();
            } else {
                await ctx.replyWithHTML(
                    '❌ Please use the buttons to select a direction.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('📈 Increase Only', 'DIRECTION_INCREASE')],
                            [Markup.button.callback('📉 Decrease Only', 'DIRECTION_DECREASE')],
                            [Markup.button.callback('📊 Both Directions', 'DIRECTION_BOTH')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
            }
        } catch (error) {
            this.logger.error(`Error in handleDirectionSelection: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(8)
    async handleViewAlerts(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }): Promise<void> {
        try {
            this.logger.debug(`Processing ${ALERTS_SCENE_ID}, step 8: handleViewAlerts, updateType: ${ctx.updateType}, action: ${ctx.wizard.state.action}`);

            const userId = ctx.from?.id;
            if (!userId) {
                throw new Error('User ID not found');
            }

            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                await ctx.answerCbQuery();

                if (data.startsWith('ALERT_')) {
                    const selectedAlertId = parseInt(data.split('_')[1]);
                    this.logger.debug(`Selected alert in view: ${selectedAlertId}`);
                    
                    ctx.wizard.state.selectedAlertId = selectedAlertId;
                    ctx.wizard.state.action = 'view_details';
                    
                    try {
                        this.logger.debug(`Fetching alert ID ${selectedAlertId} for user ${userId}`);
                        const alerts = await this.alertsService.getUserAlerts(userId);
                        
                        if (!alerts || alerts.length === 0) {
                            this.logger.error(`No alerts found for user ${userId}`);
                            await ctx.replyWithHTML(
                                '❌ You don\'t have any alerts. Create one first.',
                                { 
                                    reply_markup: Markup.inlineKeyboard([
                                        [Markup.button.callback('➕ Add New Alert', 'ADD_ALERT')],
                                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                    ]).reply_markup 
                                }
                            );
                            return;
                        }

                        const currentAlert = alerts.find(a => a.id === selectedAlertId);
                        if (!currentAlert) {
                            this.logger.error(`Alert ${selectedAlertId} not found for user ${userId}. Available alerts: ${alerts.map(a => a.id).join(', ')}`);
                            await ctx.replyWithHTML(
                                '❌ Alert not found. It may have been deleted.',
                                { 
                                    reply_markup: Markup.inlineKeyboard([
                                        [Markup.button.callback('🔄 View Your Alerts', 'VIEW_ALERTS')],
                                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                    ]).reply_markup 
                                }
                            );
                            return;
                        }
                        
                        const alertDetails = currentAlert.alertType === AlertType.ABSOLUTE_PRICE ?
                            `<b>Target Price:</b> $${currentAlert.targetPrice.toFixed(2)}` :
                            `<b>Alert Type:</b> Percentage Change\n` +
                            `<b>Trigger:</b> ${currentAlert.percentageDirection === PercentageDirection.BOTH ? 'Any' : 
                                currentAlert.percentageDirection === PercentageDirection.INCREASE ? 'Increase' : 'Decrease'} by ${currentAlert.percentageChange}%\n` +
                            `<b>Base Price:</b> $${currentAlert.basePrice ? currentAlert.basePrice.toFixed(2) : 'Not set'}`;

                        this.logger.debug(`Displaying settings for alert ${currentAlert.id}`);
                        await ctx.replyWithHTML(
                            `⚙️ <b>Price Alert Settings - ${currentAlert.mintAddress.substring(0, 8)}...${currentAlert.mintAddress.substring(currentAlert.mintAddress.length - 4)}</b>\n\n` +
                            `${alertDetails}\n` +
                            `<b>Status:</b> ${currentAlert.isActive ? '🟢 Active' : '🔴 Inactive'}`,
                            {
                                reply_markup: Markup.inlineKeyboard([
                                    [Markup.button.callback(
                                        currentAlert.alertType === AlertType.ABSOLUTE_PRICE ? '💲 Update Price' : '📊 Update Percentage',
                                        'UPDATE_PRICE'
                                    )],
                                    [Markup.button.callback('🗑️ Delete', 'DELETE_ALERT')],
                                    [Markup.button.callback(
                                        currentAlert.isActive ? '🔴 Deactivate' : '🟢 Activate',
                                        'TOGGLE_STATUS'
                                    )],
                                    [Markup.button.callback('🔄 Back to Alerts', 'VIEW_ALERTS')],
                                    [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                ]).reply_markup,
                            }
                        );
                        
                        await ctx.wizard.selectStep(9);
                    } catch (error) {
                        this.logger.error(`Error showing alert details: ${error.message}`);
                        await ctx.replyWithHTML(
                            '❌ Failed to load alert details. Please try again.',
                            { 
                                reply_markup: Markup.inlineKeyboard([
                                    [Markup.button.callback('🔄 Try Again', 'VIEW_ALERTS')],
                                    [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                                ]).reply_markup 
                            }
                        );
                    }
                    return;
                }

                if (data === 'ADD_ALERT') {
                    ctx.wizard.state = { action: 'add' };
                    ctx.wizard.selectStep(3);
                    await ctx.replyWithHTML(
                        '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                            ]).reply_markup 
                        }
                    );
                    return;
                }

                if (data === 'MAIN_MENU_BUTTON') {
                    await ctx.scene.leave();
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    return;
                }

                if (data === 'VIEW_ALERTS') {
                    this.logger.debug('Received VIEW_ALERTS in handleViewAlerts, continuing with alert display');
                } else {
                    await this.handleCallback(ctx, data);
                    return;
                }
            }

            const messageText = (ctx.message as { text: string })?.text;
            if (messageText && messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            try {
                const alerts = await this.alertsService.getUserAlerts(userId);
                if (!alerts.length) {
                    await ctx.replyWithHTML(
                        'You don\'t have any active price alerts. Use the ➕ Add New button to create one.',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('➕ Add New Alert', 'ADD_ALERT')],
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                            ]).reply_markup 
                        }
                    );
                    await ctx.scene.leave();
                    return;
                }

                const buttons = alerts.map(alert => {
                    let buttonText = '';
                    if (alert.alertType === AlertType.ABSOLUTE_PRICE) {
                        buttonText = `${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)} ($${alert.targetPrice.toFixed(2)}) ${alert.isActive ? '🟢' : '🔴'}`;
                    } else {
                        const direction = alert.percentageDirection === PercentageDirection.BOTH ? '📊' :
                            alert.percentageDirection === PercentageDirection.INCREASE ? '📈' : '📉';
                        buttonText = `${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)} (${direction} ${alert.percentageChange}%) ${alert.isActive ? '🟢' : '🔴'}`;
                    }
                    return Markup.button.callback(buttonText, `ALERT_${alert.id}`);
                });

                await ctx.replyWithHTML(
                    '🔔 <b>Your Price Alerts</b>\n\nSelect an alert to manage:',
                    {
                        reply_markup: Markup.inlineKeyboard([
                            ...buttons.map(btn => [btn]),
                            [Markup.button.callback('➕ Add New', 'ADD_ALERT')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                        ]).reply_markup,
                    }
                );
            } catch (error) {
                this.logger.error(`Error fetching alerts: ${error.message}`);
                await ctx.replyWithHTML(
                    '❌ Failed to fetch your alerts. Please try again.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🔄 Try Again', 'VIEW_ALERTS')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                        ]).reply_markup 
                    }
                );
                await ctx.scene.leave();
            }
        } catch (error) {
            this.logger.error(`Error in handleViewAlerts: ${error.message}`);
            await ctx.scene.leave();
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: 'ALERTS_AGAIN' }],
            });
        }
    }

    @WizardStep(9)
    async showAlertSettings(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${ALERTS_SCENE_ID}, step 9: showAlertSettings, updateType: ${ctx.updateType}`);

            // Handle callbacks
            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                await ctx.answerCbQuery();

                // Skip re-processing ALERT_X callbacks to prevent recursion
                if (data && data.startsWith('ALERT_')) {
                    this.logger.debug(`Ignoring ALERT_X callback in showAlertSettings to prevent recursion`);
                    return;
                }

                const userId = ctx.from?.id;
                if (!userId) {
                    throw new Error('User ID not found');
                }

                const alertId = ctx.wizard.state.selectedAlertId;
                if (!alertId) {
                    this.logger.error(`Alert ID missing in wizard state: ${JSON.stringify(ctx.wizard.state)}`);
                    await ctx.replyWithHTML(
                        '❌ No alert selected. Please try selecting an alert again.',
                        { 
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🔄 View Your Alerts', 'VIEW_ALERTS')],
                                [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                            ]).reply_markup 
                        }
                    );
                    await ctx.scene.leave();
                    return;
                }

                if (data === 'UPDATE_PRICE') {
                    ctx.wizard.state.action = 'update';
                    await ctx.replyWithHTML(
                        '💲 Please enter the new target price for the alert (in USD, e.g., 147.50):',
                        { reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup }
                    );
                    ctx.wizard.next();
                    ctx.session.__scenes = ctx.session.__scenes ?? { cursor: 0, current: ALERTS_SCENE_ID, state: {} };
                    ctx.session.__scenes.cursor = 10;
                    return;
                }

                if (data === 'DELETE_ALERT') {
                    await this.alertsService.deleteAlert(alertId, userId);
                    await ctx.replyWithHTML(
                        '🗑️ Alert deleted successfully.',
                        { reply_markup: this.keyboard.getMainKeyboard().reply_markup }
                    );
                    await ctx.scene.leave();
                    ctx.session = {};
                    return;
                }

                if (data === 'TOGGLE_STATUS') {
                    // Get current alert data
                    const alerts = await this.alertsService.getUserAlerts(userId);
                    const currentAlert = alerts.find(a => a.id === alertId);
                    
                    if (!currentAlert) {
                        throw new Error('Alert not found');
                    }
                    
                    const newStatus = !currentAlert.isActive;
                    await this.alertsService.toggleAlertStatus(alertId, userId, newStatus);
                    await ctx.replyWithHTML(
                        `✅ Alert ${newStatus ? 'activated' : 'deactivated'} successfully.`,
                        { reply_markup: this.keyboard.getMainKeyboard().reply_markup }
                    );
                    await ctx.scene.leave();
                    ctx.session = {};
                    return;
                }

                if (data === 'MAIN_MENU_BUTTON' || data === SceneActions.MAIN_MENU_BUTTON) {
                    await ctx.scene.leave();
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    return;
                }

                if (data === 'VIEW_ALERTS') {
                    ctx.wizard.state.action = 'view';
                    ctx.wizard.selectStep(8);
                    await this.handleViewAlerts(ctx);
                    return;
                }

                // Handle any other callbacks
                await ctx.scene.leave();
                await this.handleCallback(ctx, data);
                return;
            }

            // Handle commands
            const messageText = (ctx.message as { text: string })?.text;
            if (messageText && messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            // If we get here, it means we need to just wait for user input or callbacks
            ctx.wizard.selectStep(9);
        } catch (error) {
            this.logger.error(`Error in showAlertSettings: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    @WizardStep(10)
    async handleUpdatePrice(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`Processing ${ALERTS_SCENE_ID}, step 10: handleUpdatePrice, updateType: ${ctx.updateType}`);

            if (ctx.updateType === 'callback_query') {
                const data = (ctx.callbackQuery as any).data;
                await ctx.answerCbQuery();
                await ctx.scene.leave();
                await this.handleCallback(ctx, data);
                return;
            }

            const messageText = (ctx.message as { text: string }).text;
            if (messageText.startsWith('/')) {
                this.logger.debug(`Command detected: ${messageText}, exiting scene`);
                await ctx.scene.leave();
                await this.handleCommand(ctx, messageText);
                return;
            }

            const userId = ctx.from?.id;
            const alertId = ctx.wizard.state.selectedAlertId;
            if (!userId || !alertId) {
                throw new Error('User ID or alert ID not found');
            }

            // Get the current alert to determine its type
            const alerts = await this.alertsService.getUserAlerts(userId);
            const currentAlert = alerts.find(a => a.id === alertId);
            if (!currentAlert) {
                throw new Error('Alert not found');
            }

            if (currentAlert.alertType === AlertType.ABSOLUTE_PRICE) {
                const targetPrice = parseFloat(messageText);
                if (isNaN(targetPrice) || targetPrice <= 0 || targetPrice > 1000000000) {
                    this.logger.warn(`Invalid target price: ${messageText}`);
                    await ctx.replyWithHTML(
                        '❌ Please enter a valid price between 0 and 1,000,000,000 USD (e.g., 147.50).',
                        { reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup }
                    );
                    return;
                }

                const alert = await this.alertsService.updateAlert(alertId, userId, targetPrice);
                await ctx.replyWithHTML(
                    `✅ <b>Price Alert Updated!</b>\n\n` +
                    `<b>Token Mint:</b> <code>${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)}</code>\n` +
                    `<b>New Target Price:</b> $${targetPrice.toFixed(2)}\n` +
                    `<b>Status:</b> ${alert.isActive ? '🟢 Active' : '🔴 Inactive'}`,
                    { reply_markup: this.keyboard.getMainKeyboard().reply_markup }
                );
            } else {
                const percentageChange = parseFloat(messageText);
                if (isNaN(percentageChange) || percentageChange <= 0 || percentageChange > 1000) {
                    await ctx.replyWithHTML(
                        '❌ Please enter a valid percentage between 0 and 1000 (e.g., 10 for 10%).',
                        { reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup }
                    );
                    return;
                }

                const alert = await this.alertsService.updateAlert(
                    alertId,
                    userId,
                    undefined,
                    percentageChange,
                    currentAlert.percentageDirection
                );

                await ctx.replyWithHTML(
                    `✅ <b>Percentage Alert Updated!</b>\n\n` +
                    `<b>Token Mint:</b> <code>${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)}</code>\n` +
                    `<b>New Percentage:</b> ${percentageChange}%\n` +
                    `<b>Direction:</b> ${alert.percentageDirection === PercentageDirection.BOTH ? 'Any' : 
                        alert.percentageDirection === PercentageDirection.INCREASE ? 'Increase' : 'Decrease'}\n` +
                    `<b>Status:</b> ${alert.isActive ? '🟢 Active' : '🔴 Inactive'}`,
                    { reply_markup: this.keyboard.getMainKeyboard().reply_markup }
                );
            }

            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in handleUpdatePrice: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    async handleAction(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }, action: string) {
        try {
            if (action === 'ADD_ALERT') {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.PRICES.TOKEN_PRICE.ASK_MINT_ADDRESS,
                    { reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup }
                );
                ctx.wizard.selectStep(3);
                ctx.session.__scenes = ctx.session.__scenes || { cursor: 0, current: ALERTS_SCENE_ID, state: {} };
                ctx.session.__scenes.cursor = 3;
            } else if (action === 'VIEW_ALERTS') {
                await this.handleViewAlerts(ctx);
            }
        } catch (error) {
            this.logger.error(`Error in handleAction: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    private async handleCallback(ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }, data: string) {
        this.logger.debug(`Handling callback: ${data}`);

        try {
            // Handle ALERT_X callbacks
            if (data.startsWith('ALERT_')) {
                const selectedAlertId = parseInt(data.split('_')[1]);
                this.logger.debug(`Selected alert ID: ${selectedAlertId}`);
                
                // Set the alert ID directly in wizard state
                ctx.wizard.state.selectedAlertId = selectedAlertId;
                ctx.wizard.state.action = 'view_details';
                
                // Instead of re-entering the scene, just show alert settings directly
                await this.showAlertSettings(ctx);
                return;
            }
            
            switch (data) {
                case 'VIEW_ALERTS':
                    ctx.wizard.state.action = 'view';
                    await ctx.scene.enter(ALERTS_SCENE_ID, { action: 'view' });
                    break;
                case SceneActions.ALERTS_AGAIN:
                    await ctx.replyWithHTML(
                        '🔔 <b>Alerts Menu</b>\n\nSelect the type of alert you want to manage:',
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🔔 Your Token Price Alerts', 'VIEW_ALERTS')],
                                [Markup.button.callback('➕ Add New', 'ADD_ALERT')],
                                [Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON)],
                            ]).reply_markup,
                        }
                    );
                    await ctx.scene.enter(ALERTS_SCENE_ID);
                    break;
                case 'TOKENS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                        reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
                    });
                    break;
                case 'MARKETS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.MENU, {
                        reply_markup: this.keyboard.getMarketsKeyboard().reply_markup,
                    });
                    break;
                case 'PRICES_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.MENU, {
                        reply_markup: this.keyboard.getPricesKeyboard().reply_markup,
                    });
                    break;
                case 'PROGRAMS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.MENU, {
                        reply_markup: this.keyboard.getProgramsKeyboard().reply_markup,
                    });
                    break;
                case 'ACCOUNTS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.KNOWN_ACCOUNTS.MENU, {
                        reply_markup: this.keyboard.getAccountsKeyboard().reply_markup,
                    });
                    break;
                case 'NFTS_MENU':
                    await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.MENU, {
                        reply_markup: this.keyboard.getNftsKeyboard().reply_markup,
                    });
                    break;
                case SceneActions.MAIN_MENU_BUTTON:
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                default:
                    this.logger.debug(`Unknown callback data: ${data}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
            }
        } catch (error) {
            this.logger.error(`Error handling callback: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        }
    }

    private async handleCommand(ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }, command: string) {
        this.logger.debug(`Handling command: ${command}`);

        try {
            switch (command) {
                case '/knownaccounts':
                    await ctx.replyWithHTML(BOT_MESSAGES.KNOWN_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getFilterKeyboard().reply_markup,
                    });
                    break;
                case '/tokenbalances':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesKeyboard().reply_markup,
                    });
                    break;
                case '/tokenbalancests':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_BALANCES_TS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getTokenBalancesTsKeyboard().reply_markup,
                    });
                    break;
                case '/walletpnl':
                    await ctx.replyWithHTML(BOT_MESSAGES.WALLET_PNL.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getWalletPnlKeyboard().reply_markup,
                    });
                    break;
                case '/nftowners':
                    await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.ASK_ADDRESS, {
                        reply_markup: this.keyboard.getNftCollectionOwnersKeyboard().reply_markup,
                    });
                    break;
                case '/tokens':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKENS.MENU, {
                        reply_markup: this.keyboard.getTokensKeyboard().reply_markup,
                    });
                    break;
                case '/tokenholders':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersKeyboard().reply_markup,
                    });
                    break;
                case '/tokendetails':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_DETAILS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenDetailsKeyboard().reply_markup,
                    });
                    break;
                case '/tokenvolume':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_VOLUME.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenVolumeKeyboard().reply_markup,
                    });
                    break;
                case '/tokenholdersts':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_HOLDERS_TS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenHoldersTsKeyboard().reply_markup,
                    });
                    break;
                case '/tokentransfers':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRANSFERS.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTransfersKeyboard().reply_markup,
                    });
                    break;
                case '/tokentrades':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_TRADES.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenTradesKeyboard().reply_markup,
                    });
                    break;
                case '/tokenohlcv':
                    await ctx.replyWithHTML(BOT_MESSAGES.TOKEN_OHLCV.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenOhlcvResultsKeyboard().reply_markup,
                    });
                    break;
                case '/programs':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAMS.ASK_FILTER, {
                        reply_markup: this.keyboard.getProgramsKeyboard().reply_markup,
                    });
                    break;
                case '/programtxcount':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_TX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramTxCountKeyboard().reply_markup,
                    });
                    break;
                case '/programixcount':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_IX_COUNT.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramIxCountKeyboard().reply_markup,
                    });
                    break;
                case '/programactiveusersts':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS_TS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersTsKeyboard().reply_markup,
                    });
                    break;
                case '/programactiveusers':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_ACTIVE_USERS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramActiveUsersKeyboard().reply_markup,
                    });
                    break;
                case '/programdetails':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_DETAILS.ASK_PROGRAM_ADDRESS, {
                        reply_markup: this.keyboard.getProgramDetailsKeyboard().reply_markup,
                    });
                    break;
                case '/programranking':
                    await ctx.replyWithHTML(BOT_MESSAGES.PROGRAM_RANKING.ASK_LIMIT, {
                        reply_markup: this.keyboard.getProgramRankingKeyboard().reply_markup,
                    });
                    break;
                case '/pythaccounts':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_ACCOUNTS.ASK_FILTER, {
                        reply_markup: this.keyboard.getPythAccountsResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythprice':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythpricets':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_TS.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceTsResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythpriceohlc':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRICE_OHLC.ASK_PRICE_FEED_ID, {
                        reply_markup: this.keyboard.getPythPriceOhlcResultsKeyboard().reply_markup,
                    });
                    break;
                case '/pythproduct':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.PYTH_PRODUCT.ASK_PRODUCT_ID, {
                        reply_markup: this.keyboard.getPythProductResultsKeyboard().reply_markup,
                    });
                    break;
                case '/dexamm':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.DEX_AMM.SEARCHING, {
                        reply_markup: this.keyboard.getDexAmmResultsKeyboard().reply_markup,
                    });
                    break;
                case '/markets':
                    await ctx.replyWithHTML(BOT_MESSAGES.MARKETS.MENU, {
                        reply_markup: this.keyboard.getMarketsKeyboard().reply_markup,
                    });
                    break;
                case '/tokenprice':
                    await ctx.replyWithHTML(BOT_MESSAGES.PRICES.TOKEN_PRICE.ASK_MINT_ADDRESS, {
                        reply_markup: this.keyboard.getTokenPriceKeyboard().reply_markup,
                    });
                    break;
                case '/alerts':
                    await ctx.replyWithHTML(
                        '🔔 *Alerts Menu*\n\nSelect the type of alert you want to manage:',
                        {
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback('🔔 Your Token Price Alerts', 'VIEW_ALERTS')],
                                [Markup.button.callback('➕ Add New', 'ADD_ALERT')],
                                [Markup.button.callback('🏠 Back to Menu', SceneActions.MAIN_MENU_BUTTON)],
                            ]).reply_markup,
                        }
                    );
                    break;
                case '/help':
                    await ctx.replyWithHTML(BOT_MESSAGES.HELP_HEADER, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                case '/main_menu':
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                case '/cancel':
                    await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
                    break;
                default:
                    this.logger.debug(`Unknown command: ${command}`);
                    await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
                    });
            }
        } catch (error) {
            this.logger.error(`Error handling command: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        }
    }

    @Action('ALERTS_AGAIN')
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery("Let's try again");
            // Go directly to step 0 (onSceneEnter) which will show the menu
            ctx.wizard.selectStep(0);
        } catch (error) {
            this.logger.error(`Error in tryAgain: ${error.message}`);
            await ctx.scene.leave();
            // Rest of the error handling
        }
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Operation cancelled');
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onCancel: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            await ctx.answerCbQuery('Returning to main menu');
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in onMainMenu: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
            await ctx.scene.leave();
            ctx.session = {};
        } catch (error) {
            this.logger.error(`Error in cancelCommand: ${error.message}`);
            await ctx.scene.leave();
            ctx.session = {};
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.ALERTS_AGAIN }],
            });
        }
    }

    @Action('VIEW_ALERTS')
    async onViewAlertsAction(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`@Action(VIEW_ALERTS) handler called - completely bypassing wizard steps`);
            await ctx.answerCbQuery('Loading your alerts...');
            
            const userId = ctx.from?.id;
            if (!userId) {
                this.logger.error(`@Action(VIEW_ALERTS): User ID not found`);
                await ctx.replyWithHTML('❌ Error: User ID not found');
                return;
            }
            
            this.logger.debug(`@Action(VIEW_ALERTS): Fetching alerts for user ${userId}`);
            const alerts = await this.alertsService.getUserAlerts(userId);
            this.logger.debug(`@Action(VIEW_ALERTS): Got ${alerts.length} alerts`);
            
            if (!alerts || alerts.length === 0) {
                this.logger.debug(`@Action(VIEW_ALERTS): No alerts found for user ${userId}`);
                await ctx.replyWithHTML(
                    'You don\'t have any active price alerts. Use the ➕ Add New button to create one.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('➕ Add New Alert', 'ADD_ALERT_DIRECT')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                        ]).reply_markup 
                    }
                );
                return;
            }

            const buttons = alerts.map(alert => {
                let buttonText = '';
                if (alert.alertType === AlertType.ABSOLUTE_PRICE) {
                    buttonText = `${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)} ($${alert.targetPrice.toFixed(2)}) ${alert.isActive ? '🟢' : '🔴'}`;
                } else {
                    const direction = alert.percentageDirection === PercentageDirection.BOTH ? '📊' :
                        alert.percentageDirection === PercentageDirection.INCREASE ? '📈' : '📉';
                    buttonText = `${alert.mintAddress.substring(0, 8)}...${alert.mintAddress.substring(alert.mintAddress.length - 4)} (${direction} ${alert.percentageChange}%) ${alert.isActive ? '🟢' : '🔴'}`;
                }
                return Markup.button.callback(buttonText, `ALERT_${alert.id}`);
            });

            this.logger.debug(`@Action(VIEW_ALERTS): Sending reply with ${alerts.length} alerts`);
            await ctx.replyWithHTML(
                '🔔 <b>Your Price Alerts</b>\n\nSelect an alert to manage:',
                {
                    reply_markup: Markup.inlineKeyboard([
                        ...buttons.map(btn => [btn]),
                        [Markup.button.callback('➕ Add New', 'ADD_ALERT_DIRECT')],
                        [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                    ]).reply_markup,
                }
            );
            this.logger.debug(`@Action(VIEW_ALERTS): Reply sent successfully`);
            
            if (!ctx.scene.current || ctx.scene.current.id !== ALERTS_SCENE_ID) {
                this.logger.debug(`@Action(VIEW_ALERTS): Not in ALERTS_SCENE, entering scene`);
                await ctx.scene.enter(ALERTS_SCENE_ID);
            }
            
            ctx.wizard.state.action = 'view';
            this.logger.debug(`@Action(VIEW_ALERTS): Setting wizard to step 8 to handle alert selection`);
            ctx.wizard.selectStep(8);
            
        } catch (error) {
            this.logger.error(`Error in @Action(VIEW_ALERTS): ${error.message}`, error.stack);
            try {
                await ctx.replyWithHTML(
                    '❌ Failed to fetch your alerts. Please try again.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🔄 Try Again', 'VIEW_ALERTS')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                        ]).reply_markup 
                    }
                );
            } catch (e) {
                this.logger.error(`Error sending error message in @Action(VIEW_ALERTS): ${e.message}`);
            }
            
            if (ctx.scene.current) {
                await ctx.scene.leave();
            }
        }
    }

    @Action('ADD_ALERT_DIRECT')
    async onAddAlertAction(@Ctx() ctx: WizardContext & { wizard: { state: AlertsWizardState }, session: CustomSession }) {
        try {
            this.logger.debug(`@Action(ADD_ALERT_DIRECT) handler called - directly handling add alert prompt`);
            await ctx.answerCbQuery('Adding new alert...');
            
            if (ctx.scene.current && ctx.scene.current.id === ALERTS_SCENE_ID) {
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Already in ALERTS_SCENE, using in-scene handling`);
                ctx.wizard.state.action = 'add';
                
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Displaying add alert prompt via in-scene handling`);
                await ctx.replyWithHTML(
                    '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Selecting step 3 for mint address input`);
                ctx.wizard.selectStep(3);
                return;
            } else {
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Not in ALERTS_SCENE, entering scene normally`);
                await ctx.scene.enter(ALERTS_SCENE_ID);
                
                ctx.wizard.state.action = 'add';
                
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Displaying add alert prompt after scene entry`);
                await ctx.replyWithHTML(
                    '🔔 <b>Add Price Alert</b>\n\nEnter a token mint address to set a price alert for:\n\nExample:\n• <code>So11111111111111111111111111111111111111112</code> (SOL)',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')]
                        ]).reply_markup 
                    }
                );
                
                this.logger.debug(`@Action(ADD_ALERT_DIRECT): Selecting step 3 for mint address input`);
                ctx.wizard.selectStep(3);
            }
        } catch (error) {
            this.logger.error(`Error in @Action(ADD_ALERT_DIRECT): ${error.message}`, error.stack);
            try {
                await ctx.replyWithHTML(
                    '❌ Failed to start the add alert process. Please try again.',
                    { 
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('🔄 Try Again', 'ADD_ALERT_DIRECT')],
                            [Markup.button.callback('🏠 Back to Menu', 'MAIN_MENU_BUTTON')],
                        ]).reply_markup 
                    }
                );
            } catch (e) {
                this.logger.error(`Error sending error message in @Action(ADD_ALERT_DIRECT): ${e.message}`);
            }
        }
    }
}