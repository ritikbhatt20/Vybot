import { Action, Command, Ctx, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Logger } from '@nestjs/common';
import { KeyboardService } from './modules/shared/keyboard.service';
import { NlpService } from './modules/shared/nlp.service';
import { Actions } from './enums/actions.enum';
import { Commands } from './enums/commands.enum';
import { BOT_MESSAGES, commandDescriptions } from './constants';
import { KNOWN_ACCOUNTS_SCENE_ID } from './modules/known-accounts/known-accounts.scene';
import { TOKEN_BALANCES_SCENE_ID } from './modules/known-accounts/token-balances.scene';
import { TOKEN_BALANCES_TS_SCENE_ID } from './modules/known-accounts/token-balances-ts.scene';
import { WALLET_PNL_SCENE_ID } from './modules/known-accounts/wallet-pnl.scene';
import { NFT_COLLECTION_OWNERS_SCENE_ID } from './modules/nft/nft-collection-owners.scene';
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
import { PYTH_ACCOUNTS_SCENE_ID } from './modules/prices/pyth-accounts.scene';
import { TOKEN_PRICE_SCENE_ID } from './modules/prices/token-price.scene';

@Update()
export class AppUpdate {
    private readonly logger = new Logger(AppUpdate.name);

    constructor(
        private readonly keyboard: KeyboardService,
        private readonly nlpService: NlpService,
    ) { }

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
    async help(@Ctx() ctx: Context & SceneContext) {
        if (ctx.scene && ctx.scene.current) {
            await ctx.scene.leave();
        }
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
    async handleMainMenu(@Ctx() ctx: Context & SceneContext) {
        if (ctx.scene && ctx.scene.current) {
            await ctx.scene.leave();
        }
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
            ctx.session = {}; // Clear session state
            await ctx.replyWithHTML(BOT_MESSAGES.MAIN_MENU, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in main menu action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action(Actions.PRICES)
    async handlePrices(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📈 Accessing prices menu...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.reply('📈 Prices Menu', {
                reply_markup: this.keyboard.getPricesKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in prices action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @On('text')
    async handleText(@Ctx() ctx: Context & SceneContext) {
        const messageText = (ctx.message as { text: string })?.text;
        if (!messageText) {
            return; // Ignore empty messages
        }

        this.logger.debug(`Processing text input: ${messageText}, current scene: ${ctx.scene?.current?.id || 'none'}`);

        // Check if the message is a command
        if (messageText.startsWith('/')) {
            const command = messageText.slice(1).toLowerCase();
            this.logger.debug(`Detected command: ${command}`);
            if (Object.values(Commands).includes(command as Commands)) {
                // Exit current scene if active
                if (ctx.scene && ctx.scene.current) {
                    this.logger.debug(`Exiting scene ${ctx.scene.current.id} due to command: ${command}`);
                    await ctx.scene.leave();
                }

                // Handle known commands
                switch (command) {
                    case Commands.MAIN_MENU:
                        await this.handleMainMenu(ctx);
                        return;
                    case Commands.HELP:
                        await this.help(ctx);
                        return;
                    case Commands.Cancel:
                        await this.handleCancel(ctx);
                        return;
                    case Commands.KnownAccounts:
                        await this.handleKnownAccounts(ctx);
                        return;
                    case Commands.TokenBalances:
                        await this.handleTokenBalances(ctx);
                        return;
                    case Commands.PythAccounts:
                        await this.handlePythAccounts(ctx);
                        return;
                    case Commands.Tokens:
                        await this.handleTokens(ctx);
                        return;
                    case Commands.TokenHolders:
                        await this.handleTokenHolders(ctx);
                        return;
                    case Commands.TokenDetails:
                        await this.handleTokenDetails(ctx);
                        return;
                    case Commands.TokenVolume:
                        await this.handleTokenVolume(ctx);
                        return;
                    case Commands.TokenHoldersTs:
                        await this.handleTokenHoldersTs(ctx);
                        return;
                    case Commands.TokenTransfers:
                        await this.handleTokenTransfers(ctx);
                        return;
                    case Commands.TokenTrades:
                        await this.handleTokenTrades(ctx);
                        return;
                    case Commands.Programs:
                        await this.handlePrograms(ctx);
                        return;
                    case Commands.ProgramTxCount:
                        await this.handleProgramTxCount(ctx);
                        return;
                    case Commands.ProgramIxCount:
                        await this.handleProgramIxCount(ctx);
                        return;
                    case Commands.ProgramActiveUsersTs:
                        await this.handleProgramActiveUsersTs(ctx);
                        return;
                    case Commands.ProgramActiveUsers:
                        await this.handleProgramActiveUsers(ctx);
                        return;
                    case Commands.ProgramDetails:
                        await this.handleProgramDetails(ctx);
                        return;
                    case Commands.ProgramRanking:
                        await this.handleProgramRanking(ctx);
                        return;
                    case Commands.TokenPrice:
                        await this.handleTokenPrice(ctx);
                        return;
                    default:
                        this.logger.warn(`Unrecognized command: ${command}`);
                        await ctx.replyWithHTML(
                            `❌ Unrecognized command. Use /help to see all available commands.`,
                            { reply_markup: this.keyboard.getMainKeyboard().reply_markup },
                        );
                        return;
                }
            } else {
                // Handle unrecognized commands
                if (ctx.scene && ctx.scene.current) {
                    this.logger.debug(`Exiting scene ${ctx.scene.current.id} due to unrecognized command: ${command}`);
                    await ctx.scene.leave();
                }
                await ctx.replyWithHTML(
                    `❌ Unrecognized command. Use /help to see all available commands.`,
                    { reply_markup: this.keyboard.getMainKeyboard().reply_markup },
                );
                return;
            }
        }

        try {
            const intent = this.nlpService.detectIntent(messageText);
            if (!intent) {
                if (ctx.scene && ctx.scene.current) {
                    // If in a scene, let the scene handle the input
                    this.logger.debug(`No intent detected, letting scene ${ctx.scene.current.id} handle input: ${messageText}`);
                    return;
                }
                await ctx.replyWithHTML(
                    `🤔 I didn't understand "${messageText}". Try phrases like "show top token holders of bonk", "get wallet pnl", or "program ranking". Use /help to see all commands.`,
                    { reply_markup: this.keyboard.getMainKeyboard().reply_markup },
                );
                this.logger.warn(`No intent matched for input: ${messageText}`);
                return;
            }

            this.logger.log(
                `Detected intent: ${intent.command}` +
                (intent.mintAddress ? ` with mintAddress: ${intent.mintAddress}` : '') +
                (intent.programAddress ? ` with programAddress: ${intent.programAddress}` : '') +
                ` for message: ${messageText}`,
            );

            // Handle special cases that don't require scenes
            if (intent.command === Commands.HELP) {
                await this.help(ctx);
                return;
            }
            if (intent.command === Commands.MAIN_MENU) {
                await this.handleMainMenu(ctx);
                return;
            }
            if (intent.command === Commands.Cancel) {
                await this.handleCancel(ctx);
                return;
            }

            // Enter the appropriate scene
            if (intent.sceneId) {
                if (ctx.scene && ctx.scene.current) {
                    await ctx.scene.leave();
                }
                await ctx.reply(
                    `🔍 Processing your request for ${intent.command
                        .replace(/([A-Z])/g, ' $1')
                        .toLowerCase()}${intent.mintAddress
                            ? ' (token identified)'
                            : intent.programAddress
                                ? ' (program identified)'
                                : ''
                    }...`,
                );
                const sceneState: { mintAddress?: string; programAddress?: string } = {};
                if (intent.mintAddress) {
                    sceneState.mintAddress = intent.mintAddress;
                }
                if (intent.programAddress) {
                    sceneState.programAddress = intent.programAddress;
                }
                this.logger.debug(`Entering scene ${intent.sceneId} with state: ${JSON.stringify(sceneState)}`);
                await ctx.scene.enter(intent.sceneId, sceneState);
            } else {
                await ctx.replyWithHTML(
                    `❌ Unable to process request for ${intent.command}. Try /help for more options.`,
                    { reply_markup: this.keyboard.getMainKeyboard().reply_markup },
                );
            }
        } catch (error) {
            this.logger.error(`Error handling text input: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('FILTER_AGAIN')
    async handleFilterAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing filter options...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_BALANCES_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in token balances time series again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('WALLET_PNL')
    async handleWalletPnl(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('📊 Accessing wallet PnL analysis...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(WALLET_PNL_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in wallet PnL action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('WALLET_PNL_AGAIN')
    async handleWalletPnlAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing wallet PnL query...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(WALLET_PNL_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in wallet PnL again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('NFT_OWNERS')
    async handleNftOwners(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🎨 Accessing NFT collection owners...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(NFT_COLLECTION_OWNERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in NFT owners action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('NFT_OWNERS_AGAIN')
    async handleNftOwnersAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing NFT owners query...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(NFT_COLLECTION_OWNERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in NFT owners again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('TOKENS_AGAIN')
    async handleTokensAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing tokens query...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
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
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_RANKING_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in program ranking again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Action('PYTH_ACCOUNTS_AGAIN')
    async handlePythAccountsAgain(@Ctx() ctx: Context & SceneContext) {
        try {
            await ctx.answerCbQuery('🔄 Preparing Pyth accounts query...');
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PYTH_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error in Pyth accounts again action: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.KnownAccounts)
    async handleKnownAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(KNOWN_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering known accounts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenBalances)
    async handleTokenBalances(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_BALANCES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token balances scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.PythAccounts)
    async handlePythAccounts(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PYTH_ACCOUNTS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering Pyth accounts scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Tokens)
    async handleTokens(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKENS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering tokens scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHolders)
    async handleTokenHolders(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_HOLDERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenDetails)
    async handleTokenDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token details scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenVolume)
    async handleTokenVolume(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_VOLUME_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token volume scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenHoldersTs)
    async handleTokenHoldersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_HOLDERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token holders time series scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTransfers)
    async handleTokenTransfers(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_TRANSFERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token transfers scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenTrades)
    async handleTokenTrades(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_TRADES_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token trades scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Programs)
    async handlePrograms(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAMS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering programs scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramTxCount)
    async handleProgramTxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_TX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program tx count scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramIxCount)
    async handleProgramIxCount(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_IX_COUNT_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ix count scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramActiveUsersTs)
    async handleProgramActiveUsersTs(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_TS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users time series scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramActiveUsers)
    async handleProgramActiveUsers(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_ACTIVE_USERS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program active users scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramDetails)
    async handleProgramDetails(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_DETAILS_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program details scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.ProgramRanking)
    async handleProgramRanking(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(PROGRAM_RANKING_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering program ranking scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.TokenPrice)
    async handleTokenPrice(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.scene.enter(TOKEN_PRICE_SCENE_ID);
        } catch (error) {
            this.logger.error(`Error entering token price scene: ${error.message}`);
            await ctx.replyWithHTML(BOT_MESSAGES.ERROR.GENERIC);
        }
    }

    @Command(Commands.Cancel)
    async handleCancel(@Ctx() ctx: Context & SceneContext) {
        try {
            if (ctx.scene && ctx.scene.current) {
                await ctx.scene.leave();
            }
            await ctx.replyWithHTML(BOT_MESSAGES.CANCEL, {
                reply_markup: this.keyboard.getMainKeyboard().reply_markup,
            });
        } catch (error) {
            this.logger.error(`Error in cancel command: ${error.message}`);
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
