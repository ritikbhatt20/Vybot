import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from '../shared/keyboard.service';
import { Actions } from '../../enums/actions.enum';
import { Commands } from '../../enums/commands.enum';
import { PROGRAMS_SCENE_ID } from './programs.scene';
import { PROGRAM_TX_COUNT_SCENE_ID } from './program-tx-count.scene';
import { PROGRAM_IX_COUNT_SCENE_ID } from './program-ix-count.scene';
import { PROGRAM_ACTIVE_USERS_TS_SCENE_ID } from './program-active-users-ts.scene';
import { PROGRAM_ACTIVE_USERS_SCENE_ID } from './program-active-users.scene';
import { PROGRAM_DETAILS_SCENE_ID } from './program-details.scene';
import { PROGRAM_RANKING_SCENE_ID } from './program-ranking.scene';
import { BOT_MESSAGES } from '../../constants';

@Update()
export class ProgramsUpdate {
    private readonly logger = new Logger(ProgramsUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Action(Actions.TOKENS_MENU)
    async onTokensMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing Tokens menu...');
            await ctx.replyWithHTML(
                BOT_MESSAGES.TOKENS.MENU,
                { reply_markup: this.keyboard.getTokensKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering Tokens menu: ${error.message}`);
        }
    }

    @Action(Actions.ACCOUNTS_MENU)
    async onAccountsMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('👤 Accessing Accounts menu...');
            await ctx.replyWithHTML(
                '👤 Discover Accounts Insights:',
                { reply_markup: this.keyboard.getAccountsKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering Accounts menu: ${error.message}`);
        }
    }

    @Action(Actions.NFTS_MENU)
    async onNftsMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🎨 Accessing NFTs menu...');
            await ctx.replyWithHTML(
                '🎨 Dive into NFTs features:',
                { reply_markup: this.keyboard.getNftsKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering NFTs menu: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAMS_MENU)
    async onProgramsMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🛠️ Accessing Programs menu...');
            await ctx.replyWithHTML(
                '🛠️ Access Programs Utilities:',
                { reply_markup: this.keyboard.getProgramsKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering Programs menu: ${error.message}`);
        }
    }

    @Action(Actions.PRICES_MENU)
    async onPricesMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing Prices menu...');
            await ctx.replyWithHTML(
                '📈 Explore Prices Insights:',
                { reply_markup: this.keyboard.getPricesKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering Prices menu: ${error.message}`);
        }
    }

    @Action(Actions.MARKETS_MENU)
    async onMarketsMenu(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing Markets menu...');
            await ctx.replyWithHTML(
                BOT_MESSAGES.MARKETS.MENU,
                { reply_markup: this.keyboard.getMarketsKeyboard().reply_markup }
            );
        } catch (error) {
            this.logger.error(`Error entering Markets menu: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAMS)
    async onPrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔍 Accessing programs explorer...');
            await ctx.scene.enter(PROGRAMS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering programs scene: ${error.message}`);
        }
    }

    @Command(Commands.Programs)
    async handlePrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🔍 Opening programs explorer...'),
                ctx.scene.enter(PROGRAMS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling programs command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_TX_COUNT)
    async onProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing transaction count time series...');
            await ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program tx count scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramTxCount)
    async handleProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening transaction count time series explorer...'),
                ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program tx count command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_IX_COUNT)
    async onProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing instruction count time series...');
            await ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ix count scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramIxCount)
    async handleProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening instruction count time series explorer...'),
                ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program ix count command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_ACTIVE_USERS_TS)
    async onProgramActiveUsersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing active users time series...');
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users time series scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramActiveUsersTs)
    async handleProgramActiveUsersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening active users time series explorer...'),
                ctx.scene.enter(PROGRAM_ACTIVE_USERS_TS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program active users time series command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_ACTIVE_USERS)
    async onProgramActiveUsers(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing active users...');
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramActiveUsers)
    async handleProgramActiveUsers(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📈 Opening active users explorer...'),
                ctx.scene.enter(PROGRAM_ACTIVE_USERS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program active users command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_DETAILS)
    async onProgramDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📋 Accessing program details...');
            await ctx.scene.enter(PROGRAM_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program details scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramDetails)
    async handleProgramDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('📋 Opening program details explorer...'),
                ctx.scene.enter(PROGRAM_DETAILS_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program details command: ${error.message}`);
        }
    }

    @Action(Actions.PROGRAM_RANKING)
    async onProgramRanking(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🏆 Accessing program rankings...');
            await ctx.scene.enter(PROGRAM_RANKING_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ranking scene: ${error.message}`);
        }
    }

    @Command(Commands.ProgramRanking)
    async handleProgramRanking(@Ctx() ctx: Context & SceneContext) {
        try {
            const [message] = await Promise.allSettled([
                ctx.reply('🏆 Opening program rankings explorer...'),
                ctx.scene.enter(PROGRAM_RANKING_SCENE_ID),
            ]);

            if (message.status === 'fulfilled') {
                await ctx.deleteMessage(message.value.message_id).catch(() => { });
            }
        } catch (error) {
            this.logger.error(`Error handling program ranking command: ${error.message}`);
        }
    }
}
