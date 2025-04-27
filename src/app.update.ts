import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { BOT_MESSAGES, commandDescriptions } from './constants';
import { KNOWN_ACCOUNTS_SCENE_ID } from './modules/known-accounts/known-accounts.scene';
import { TOKEN_BALANCES_SCENE_ID } from './modules/known-accounts/token-balances.scene';
import { TOKEN_BALANCES_TS_SCENE_ID } from './modules/known-accounts/token-balances-ts.scene';
import { TOKENS_SCENE_ID } from './modules/tokens/tokens.scene';
import { TOKEN_HOLDERS_SCENE_ID } from './modules/tokens/token-holders.scene';
import { TOKEN_DETAILS_SCENE_ID } from './modules/tokens/token-details.scene';
import { TOKEN_VOLUME_SCENE_ID } from './modules/tokens/token-volume.scene';
import { TOKEN_HOLDERS_TS_SCENE_ID } from './modules/tokens/token-holders-ts.scene';
import { TOKEN_TRANSFERS_SCENE_ID } from './modules/tokens/token-transfers.scene';
import { TOKEN_TRADES_SCENE_ID } from './modules/tokens/token-trades.scene';
import { PROGRAMS_SCENE_ID } from './modules/programs/programs.scene';
import { PROGRAM_TX_COUNT_SCENE_ID } from './modules/programs/program-tx-count.scene';
import { PROGRAM_IX_COUNT_SCENE_ID } from './modules/programs/program-ix-count.scene';
import { PROGRAM_ACTIVE_USERS_TS_SCENE_ID } from './modules/programs/program-active-users-ts.scene';
import { PROGRAM_ACTIVE_USERS_SCENE_ID } from './modules/programs/program-active-users.scene';
import { PROGRAM_DETAILS_SCENE_ID } from './modules/programs/program-details.scene';
import { PROGRAM_RANKING_SCENE_ID } from './modules/programs/program-ranking.scene';

@Update()
export class AppUpdate {
    private readonly logger = new Logger(AppUpdate.name);

    constructor(private readonly keyboard: KeyboardService) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        this.logger.log(
            `New user started the bot: ${ctx.from?.id} (${ctx.from?.username || 'no username'})`
        );

        await ctx.replyWithHTML(BOT_MESSAGES.WELCOME, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Help()
    @Action(Actions.HELP)
    async help(@Ctx() ctx: Context) {
        const helpMessage = Object.values(commandDescriptions).join('\n');

        await ctx.replyWithHTML(`${BOT_MESSAGES.HELP_HEADER}${helpMessage}`, {
            reply_markup: this.keyboard.getCloseKeyboard().reply_markup,
        });
    }

    @Action(Actions.CLOSE)
    async onClose(@Ctx() ctx: Context) {
        try {
            await ctx.answerCbQuery();
            await ctx.deleteMessage();
        } catch (error) {
            this.logger.error(`Error in close action: ${error.message}`);
        }
    }

    @Command(Commands.MAIN_MENU)
    async handleMainMenu(@Ctx() ctx: Context) {
        await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
            reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        });
    }

    @Action(Actions.MAIN_MENU)
    @Action('MAIN_MENU_BUTTON')
    async handleMainMenuAction(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('Returning to main menu');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in main menu action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('FILTER_AGAIN')
    async handleFilterAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing filter options...');
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in filter again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_BALANCES_AGAIN')
    async handleTokenBalancesAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token balances query...');
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token balances again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_BALANCES_TS')
    async handleTokenBalancesTs(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing token balances time series...');
            await ctx.scene.enter(TOKEN_BALANCES_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token balances time series action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_BALANCES_TS_AGAIN')
    async handleTokenBalancesTsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token balances time series query...');
            await ctx.scene.enter(TOKEN_BALANCES_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token balances time series again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKENS_AGAIN')
    async handleTokensAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing tokens query...');
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in tokens again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_HOLDERS_AGAIN')
    async handleTokenHoldersAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing top token holders query...');
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token holders again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_DETAILS_AGAIN')
    async handleTokenDetailsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token details query...');
            await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token details again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_VOLUME_AGAIN')
    async handleTokenVolumeAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token volume query...');
            await ctx.scene.enter(TOKEN_VOLUME_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token volume again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_HOLDERS_TS_AGAIN')
    async handleTokenHoldersTsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token holders time series query...');
            await ctx.scene.enter(TOKEN_HOLDERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token holders time series again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_TRANSFERS_AGAIN')
    async handleTokenTransfersAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token transfers query...');
            await ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token transfers again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKEN_TRADES_AGAIN')
    async handleTokenTradesAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing token trades query...');
            await ctx.scene.enter(TOKEN_TRADES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token trades again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAMS_AGAIN')
    async handleProgramsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing programs query...');
            await ctx.scene.enter(PROGRAMS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in programs again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_TX_COUNT_AGAIN')
    async handleProgramTxCountAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program transaction count query...');
            await ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program tx count again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_IX_COUNT_AGAIN')
    async handleProgramIxCountAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program instruction count query...');
            await ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program ix count again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_ACTIVE_USERS_TS_AGAIN')
    async handleProgramActiveUsersTsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program active users time series query...');
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program active users time series again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_ACTIVE_USERS_AGAIN')
    async handleProgramActiveUsersAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program active users query...');
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program active users again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_DETAILS_AGAIN')
    async handleProgramDetailsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program details query...');
            await ctx.scene.enter(PROGRAM_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program details again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PROGRAM_RANKING_AGAIN')
    async handleProgramRankingAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing program rankings query...');
            await ctx.scene.enter(PROGRAM_RANKING_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program ranking again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.KnownAccounts)
    async handleKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering known accounts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenBalances)
    async handleTokenBalances(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token balances scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Tokens)
    async handleTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering tokens scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHolders)
    async handleTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenDetails)
    async handleTokenDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token details scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenVolume)
    async handleTokenVolume(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_VOLUME_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token volume scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHoldersTs)
    async handleTokenHoldersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_HOLDERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders time series scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTransfers)
    async handleTokenTransfers(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token transfers scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTrades)
    async handleTokenTrades(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(TOKEN_TRADES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token trades scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Programs)
    async handlePrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAMS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering programs scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramTxCount)
    async handleProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program tx count scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramIxCount)
    async handleProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ix count scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramActiveUsersTs)
    async handleProgramActiveUsersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users time series scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramActiveUsers)
    async handleProgramActiveUsers(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramDetails)
    async handleProgramDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program details scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramRanking)
    async handleProgramRanking(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.scene.enter(PROGRAM_RANKING_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ranking scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('CLOSE_BUTTON')
    async handleCloseButton(@Ctx() ctx: Context) {
        try {
            await ctx.answerCbQuery();
            await ctx.deleteMessage();
        } catch (error) {
            this.logger.error(`Error in close button action: ${error.message}`);
        }
    }

    @Action('CANCEL_BUTTON')
    async handleCancelButton(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('Operation cancelled');

            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }

            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in cancel button action: ${error.message}`);
        }
    }
}
