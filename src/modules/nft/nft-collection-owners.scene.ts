import { Wizard, WizardStep, Ctx, Action, Command } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftCollectionOwner } from 'src/types';
import { KeyboardService } from '../shared/keyboard.service';
import { Commands } from '../../enums/commands.enum';
import { SceneActions } from '../../enums/actions.enum';
import { BOT_MESSAGES } from '../../constants';
import { handleErrorResponse, formatAddress, isValidSolanaAddress, escapeMarkdownV2 } from '../../utils';

export const NFT_COLLECTION_OWNERS_SCENE_ID = 'NFT_COLLECTION_OWNERS_SCENE';

interface NftCollectionOwnersWizardState {
    collectionAddress?: string;
}

@Wizard(NFT_COLLECTION_OWNERS_SCENE_ID)
export class NftCollectionOwnersScene {
    private readonly logger = new Logger(NftCollectionOwnersScene.name);

    constructor(
        private readonly nftService: NftService,
        private readonly keyboard: KeyboardService,
    ) { }

    @WizardStep(1)
    async askCollectionAddress(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
        try {
            await ctx.replyWithHTML(
                BOT_MESSAGES.NFT_OWNERS.ASK_ADDRESS,
                { reply_markup: this.keyboard.getNftCollectionOwnersKeyboard().reply_markup }
            );
            ctx.wizard.next();
        } catch (error) {
            this.logger.error(`Error in ask collection address step: ${error.message}`);
            await ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async handleOwnersQuery(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
        try {
            const messageText = (ctx.message as { text: string })?.text;
            if (!messageText || !isValidSolanaAddress(messageText)) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.ERROR.INVALID_FORMAT,
                    { reply_markup: this.keyboard.getNftCollectionOwnersKeyboard().reply_markup }
                );
                return;
            }

            ctx.wizard.state.collectionAddress = messageText;

            await ctx.replyWithHTML(BOT_MESSAGES.NFT_OWNERS.SEARCHING);

            const owners = await this.nftService.getCollectionOwners(messageText);

            if (!Array.isArray(owners) || owners.length === 0) {
                await ctx.replyWithHTML(
                    BOT_MESSAGES.NFT_OWNERS.NO_RESULTS,
                    { reply_markup: this.keyboard.getNftCollectionOwnersResultsKeyboard().reply_markup }
                );
                await ctx.scene.leave();
                return;
            }

            const message = owners
                .slice(0, 10)
                .map((owner: NftCollectionOwner, i: number) => {
                    return (
                        `<b>${i + 1}. Owner: <code>${owner.owner}</code></b>\n` +
                        `🎨 <b>NFTs Owned:</b> ${escapeMarkdownV2(owner.amount.toString())}`
                    );
                })
                .join('\n\n');

            await ctx.replyWithHTML(
                `${BOT_MESSAGES.NFT_OWNERS.RESULTS_HEADER}${message}`,
                { reply_markup: this.keyboard.getNftCollectionOwnersResultsKeyboard().reply_markup }
            );

            await ctx.scene.leave();
        } catch (error) {
            this.logger.error(`Error in handle owners query step: ${error.message}`);
            await handleErrorResponse({
                ctx,
                error,
                defaultMessage: BOT_MESSAGES.ERROR.API_ERROR,
                buttons: [{ text: '🔄 Try Again', action: SceneActions.NFT_OWNERS_AGAIN }],
            });
            await ctx.scene.leave();
        }
    }

    @Action(SceneActions.NFT_OWNERS_AGAIN)
    async tryAgain(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
        await ctx.answerCbQuery("Let's try again");
        ctx.wizard.selectStep(1);
        await this.askCollectionAddress(ctx);
    }

    @Action(SceneActions.CANCEL_BUTTON)
    async onCancel(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
        await ctx.answerCbQuery('Operation cancelled');
        await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Action(SceneActions.MAIN_MENU_BUTTON)
    async onMainMenu(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
        await ctx.answerCbQuery('Returning to main menu');
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
        await ctx.scene.leave();
    }

    @Command(Commands.Cancel)
    async cancelCommand(@Ctx() ctx: WizardContext & { wizard: { state: NftCollectionOwnersWizardState } }) {
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