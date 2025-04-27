import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { NFT_COLLECTION_OWNERS_SCENE_ID } from './nft-collection-owners.scene';

@Update()
export class NftUpdate {
    private readonly logger = new Logger(NftUpdate.name);

    @Action(Actions.NFT_OWNERS)
    async onNftOwners(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔍 Accessing NFT collection owners...');
            await ctx.scene.enter(NFT_COLLECTION_OWNERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering NFT collection owners scene: ${error.message}`);
        }
    }

    @Command(Commands.NftOwners)
    async handleNftOwners(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🔍 Opening NFT collection owners explorer...'),
                ctx.scene.enter(NFT_COLLECTION_OWNERS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling NFT collection owners command: ${error.message}`);
        }
    }
}