import { Scene, SceneEnter, On, Ctx, Action } from 'nestjs-telegraf';
import { KeyboardService } from '../shared/keyboard.service';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { PatternType } from './entities/pattern-alert.entity';
import { Context } from '../shared/interfaces/context.interface';
import { Logger } from '@nestjs/common';
import { BOT_MESSAGES } from '../../constants';
import { PATTERN_ALERTS_SCENE_ID } from './pattern-alerts.scene';

export const PATTERN_RECOGNITION_SCENE_ID = 'pattern-recognition';

interface PatternRecognitionState {
    pattern?: PatternType;
    selectedToken?: string;
    timeframe?: string;
    confidence?: number;
}

interface PatternRecognitionContext extends Context {
    session: PatternRecognitionState;
    scene: {
        state: PatternRecognitionState;
        enter: (sceneName: string) => Promise<void>;
        leave: () => Promise<void>;
    };
}

@Scene('pattern-recognition')
export class PatternRecognitionScene {
    private readonly logger = new Logger(PatternRecognitionScene.name);

    constructor(
        private readonly keyboardService: KeyboardService,
        private readonly patternRecognitionService: PatternRecognitionService,
    ) {}

    private formatPatternName(pattern: PatternType): string {
        return pattern
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: PatternRecognitionContext) {
        const pattern = ctx.scene.state?.pattern;
        if (pattern) {
            ctx.session.pattern = pattern;
            await this.askForToken(ctx);
        } else {
            await ctx.reply(
                BOT_MESSAGES.PATTERNS.MENU,
                { reply_markup: this.keyboardService.getPatternsKeyboard().reply_markup }
            );
        }
    }

    private async askForToken(ctx: PatternRecognitionContext) {
        await ctx.reply(
            BOT_MESSAGES.PATTERNS.ASK_TOKEN,
            { 
                parse_mode: 'Markdown',
                reply_markup: this.keyboardService.createInlineKeyboard([
                    [{ text: '🔙 Back to Menu', callback_data: 'back_to_patterns_menu' }]
                ])
            }
        );
    }

    @Action('back_to_patterns_menu')
    async onBackToPatternsMenu(@Ctx() ctx: PatternRecognitionContext) {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
            BOT_MESSAGES.PATTERNS.MENU,
            { reply_markup: this.keyboardService.getPatternsKeyboard().reply_markup }
        );
    }

    @On('text')
    async onText(@Ctx() ctx: PatternRecognitionContext) {
        if (!ctx.session.pattern) {
            await ctx.reply(
                BOT_MESSAGES.PATTERNS.MENU,
                { reply_markup: this.keyboardService.getPatternsKeyboard().reply_markup }
            );
            return;
        }

        const text = (ctx.message as any).text;
        ctx.session.selectedToken = text;
        await this.showTimeframeSelection(ctx);
    }

    private async showTimeframeSelection(ctx: PatternRecognitionContext) {
        await ctx.reply(
            BOT_MESSAGES.PATTERNS.ASK_TIMEFRAME,
            {
                reply_markup: this.keyboardService.createInlineKeyboard([
                    [
                        { text: '1H', callback_data: 'timeframe_1h' },
                        { text: '4H', callback_data: 'timeframe_4h' },
                        { text: '1D', callback_data: 'timeframe_1d' },
                    ],
                    [{ text: '❌ Cancel', callback_data: 'cancel' }],
                ]),
            },
        );
    }

    @Action(/^timeframe_(.+)$/)
    async onTimeframeSelect(@Ctx() ctx: PatternRecognitionContext) {
        if (!ctx.callbackQuery?.data) return;
        
        const match = ctx.callbackQuery.data.match(/^timeframe_(.+)$/);
        if (!match) return;

        const timeframe = match[1];
        ctx.session.timeframe = timeframe;

        await this.showConfidenceSelection(ctx);
    }

    private async showConfidenceSelection(ctx: PatternRecognitionContext) {
        await ctx.editMessageText(
            BOT_MESSAGES.PATTERNS.ASK_CONFIDENCE,
            {
                reply_markup: this.keyboardService.createInlineKeyboard([
                    [
                        { text: '70%', callback_data: 'confidence_70' },
                        { text: '80%', callback_data: 'confidence_80' },
                        { text: '90%', callback_data: 'confidence_90' },
                    ],
                    [{ text: '❌ Cancel', callback_data: 'cancel' }],
                ]),
            },
        );
    }

    @Action(/^confidence_(\d+)$/)
    async onConfidenceSelect(@Ctx() ctx: PatternRecognitionContext) {
        if (!ctx.callbackQuery?.data) return;
        
        const match = ctx.callbackQuery.data.match(/^confidence_(\d+)$/);
        if (!match) return;

        const confidence = parseInt(match[1]);
        ctx.session.confidence = confidence;

        if (!ctx.session.selectedToken || !ctx.session.pattern || !ctx.session.timeframe) {
            await ctx.editMessageText('❌ Missing required information. Please start over.');
            return;
        }

        try {
            const alert = await this.patternRecognitionService.createPatternAlert(
                ctx.from.id,
                ctx.session.selectedToken,
                [ctx.session.pattern],
                ctx.session.timeframe,
                confidence
            );

            const message = BOT_MESSAGES.PATTERNS.PATTERN_ADDED
                .replace('${token}', ctx.session.selectedToken)
                .replace('${pattern}', this.formatPatternName(ctx.session.pattern))
                .replace('${timeframe}', ctx.session.timeframe.toUpperCase())
                .replace('${confidence}', confidence.toString());

            await ctx.editMessageText(
                message,
                {
                    parse_mode: 'Markdown',
                    reply_markup: this.keyboardService.getPatternsResultsKeyboard().reply_markup,
                },
            );

            // Clear session data
            delete ctx.session.pattern;
            delete ctx.session.selectedToken;
            delete ctx.session.timeframe;
            delete ctx.session.confidence;
        } catch (error) {
            this.logger.error('Error creating pattern alert:', error);
            await ctx.editMessageText(
                '❌ Error creating pattern alert. Please try again.',
                {
                    reply_markup: this.keyboardService.createInlineKeyboard([
                        [{ text: '🔄 Try Again', callback_data: 'pattern_recognition' }],
                        [{ text: '🏠 Back to Main Menu', callback_data: 'back_to_main' }],
                    ]),
                },
            );
        }
    }

    @Action('cancel')
    async onCancel(@Ctx() ctx: PatternRecognitionContext) {
        await ctx.scene.leave();
        await ctx.editMessageText(
            '❌ Pattern recognition setup cancelled.',
            {
                reply_markup: this.keyboardService.createInlineKeyboard([
                    [{ text: '🏠 Back to Main Menu', callback_data: 'back_to_main' }],
                ]),
            },
        );
    }

    @Action('my_pattern_alerts')
    async onMyPatternAlerts(@Ctx() ctx: PatternRecognitionContext) {
        await ctx.answerCbQuery('📋 Opening your pattern alerts...');
        await ctx.scene.enter(PATTERN_ALERTS_SCENE_ID);
    }
} 