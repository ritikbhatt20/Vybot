import { Actions, SceneActions } from '../enums/actions.enum';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';

const logger = new Logger('Utils');

// Escape special characters for Markdown V2 formatting
export function escapeMarkdownV2(text: string): string {
    if (typeof text !== 'string') {
        return '';
    }
    const specialCharsRegex = /([_*\[\]()~`>#\+\-=|{}.!])/g;
    return text.replace(specialCharsRegex, '\\$1');
}

// Format Solana address to make it more readable
export function formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch (error) {
        logger.warn(`Invalid Solana address: ${address}`);
        return false;
    }
}

// Interface for error button
interface ErrorButton {
    text: string;
    action: string;
}

// Options for handling error responses
interface ErrorResponseOptions {
    error: any;
    defaultMessage: string;
    ctx: any;
    buttons?: ErrorButton[];
    prefix?: string;
}

// Handle API errors with a consistent UI
export async function handleErrorResponse({
    error,
    defaultMessage,
    ctx,
    buttons = [],
    prefix = '🛑',
}: ErrorResponseOptions) {
    try {
        logger.error(`API Error: ${error?.message}`, error?.stack);

        let errorMessage = error?.response?.data?.message || defaultMessage;
        // Customize message for timeout errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = '❌ API request timed out. The server is taking too long to respond. Please try again later.';
        }

        let finalButtons = [...buttons];

        if (!ctx.scene?.current) {
            finalButtons.push({ text: '❌ Close', action: SceneActions.CLOSE_BUTTON });
        }

        if (ctx.scene?.current) {
            finalButtons.push({ text: '🚫 Cancel', action: SceneActions.CANCEL_BUTTON });
        }

        const keyboard = finalButtons.map((btn) => [
            Markup.button.callback(btn.text, btn.action),
        ]);

        await ctx.replyWithHTML(`${prefix} ${escapeMarkdownV2(errorMessage)}`, {
            reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        });
    } catch (secondaryError) {
        logger.error(`Error in error handler: ${secondaryError.message}`);
        await ctx.reply('An error occurred. Please try again later.');
    }
}
