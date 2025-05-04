import { Injectable, Logger } from '@nestjs/common';
import { WordTokenizer, PorterStemmer } from 'natural';
import { Commands } from '../../enums/commands.enum';

@Injectable()
export class NlpService {
    private readonly logger = new Logger(NlpService.name);
    private readonly tokenizer = new WordTokenizer();
    private readonly stemmer = PorterStemmer;

    // Mapping of commands to keywords/phrases for intent recognition
    private readonly intentMap: { command: Commands; keywords: string[]; exactPhrases?: string[] }[] = [
        {
            command: Commands.KnownAccounts,
            keywords: ['known accounts', 'labeled accounts', 'account labels'],
            exactPhrases: ['known accounts', 'labeled accounts'],
        },
        {
            command: Commands.TokenBalances,
            keywords: ['token balances', 'wallet balances', 'account tokens'],
            exactPhrases: ['token balances', 'wallet balances'],
        },
        {
            command: Commands.TokenBalancesTs,
            keywords: ['token balances time series', 'balance history', 'token balance trends'],
            exactPhrases: ['token balances time series', 'balance history'],
        },
        {
            command: Commands.WalletPnl,
            keywords: ['wallet pnl', 'profit and loss', 'trading performance'],
            exactPhrases: ['wallet pnl', 'profit and loss'],
        },
        {
            command: Commands.NftOwners,
            keywords: ['nft owners', 'nft collection owners', 'nft holders'],
            exactPhrases: ['nft owners', 'nft collection owners'],
        },
        {
            command: Commands.Tokens,
            keywords: ['all tokens', 'tracked tokens', 'list tokens'],
            exactPhrases: ['all tokens', 'tracked tokens'],
        },
        {
            command: Commands.TokenHolders,
            keywords: ['top token holders', 'token holders', 'holders of token'],
            exactPhrases: ['top token holders', 'token holders'],
        },
        {
            command: Commands.TokenDetails,
            keywords: ['token details', 'token info', 'token metadata'],
            exactPhrases: ['token details', 'token info'],
        },
        {
            command: Commands.TokenVolume,
            keywords: ['token volume', 'volume trends', 'token trading volume'],
            exactPhrases: ['token volume', 'volume trends'],
        },
        {
            command: Commands.TokenHoldersTs,
            keywords: ['token holders time series', 'holders trends', 'holder history'],
            exactPhrases: ['token holders time series', 'holders trends'],
        },
        {
            command: Commands.TokenTransfers,
            keywords: ['token transfers', 'transfer transactions', 'token movements'],
            exactPhrases: ['token transfers', 'transfer transactions'],
        },
        {
            command: Commands.TokenTrades,
            keywords: ['token trades', 'trade transactions', 'trading activity'],
            exactPhrases: ['token trades', 'trade transactions'],
        },
        {
            command: Commands.Programs,
            keywords: ['all programs', 'solana programs', 'on-chain programs'],
            exactPhrases: ['all programs', 'solana programs'],
        },
        {
            command: Commands.ProgramTxCount,
            keywords: ['program transaction count', 'program tx count', 'program transactions'],
            exactPhrases: ['program transaction count', 'program tx count'],
        },
        {
            command: Commands.ProgramIxCount,
            keywords: ['program instruction count', 'program ix count', 'program instructions'],
            exactPhrases: ['program instruction count', 'program ix count'],
        },
        {
            command: Commands.ProgramActiveUsersTs,
            keywords: ['program active users time series', 'active users trends', 'program user history'],
            exactPhrases: ['program active users time series', 'active users trends'],
        },
        {
            command: Commands.ProgramActiveUsers,
            keywords: ['program active users', 'active program users', 'program users'],
            exactPhrases: ['program active users', 'active program users'],
        },
        {
            command: Commands.ProgramDetails,
            keywords: ['program details', 'program info', 'program metadata'],
            exactPhrases: ['program details', 'program info'],
        },
        {
            command: Commands.ProgramRanking,
            keywords: ['program ranking', 'top programs', 'program leaderboard'],
            exactPhrases: ['program ranking', 'top programs'],
        },
        {
            command: Commands.PythAccounts,
            keywords: ['pyth accounts', 'pyth oracle accounts', 'price accounts'],
            exactPhrases: ['pyth accounts', 'pyth oracle accounts'],
        },
        {
            command: Commands.PythPrice,
            keywords: ['pyth price', 'oracle price', 'price feed'],
            exactPhrases: ['pyth price', 'oracle price'],
        },
        {
            command: Commands.PythPriceTs,
            keywords: ['pyth price time series', 'price history', 'price trends'],
            exactPhrases: ['pyth price time series', 'price history'],
        },
        {
            command: Commands.PythPriceOhlc,
            keywords: ['pyth price ohlc', 'ohlc price', 'price candlestick'],
            exactPhrases: ['pyth price ohlc', 'ohlc price'],
        },
        {
            command: Commands.TokenOhlcv,
            keywords: ['token ohlcv', 'ohlcv data', 'token price chart'],
            exactPhrases: ['token ohlcv', 'ohlcv data'],
        },
        {
            command: Commands.PythProduct,
            keywords: ['pyth product', 'product metadata', 'pyth metadata'],
            exactPhrases: ['pyth product', 'product metadata'],
        },
        {
            command: Commands.DexAmm,
            keywords: ['dex amm', 'decentralized exchange', 'amm programs'],
            exactPhrases: ['dex amm', 'decentralized exchange'],
        },
        {
            command: Commands.Markets,
            keywords: ['markets', 'trading markets', 'market info'],
            exactPhrases: ['markets', 'trading markets'],
        },
        {
            command: Commands.HELP,
            keywords: ['help', 'commands', 'how to use'],
            exactPhrases: ['help', 'commands'],
        },
        {
            command: Commands.MAIN_MENU,
            keywords: ['main menu', 'home', 'start over'],
            exactPhrases: ['main menu', 'home'],
        },
        {
            command: Commands.Cancel,
            keywords: ['cancel', 'stop', 'exit'],
            exactPhrases: ['cancel', 'stop'],
        },
    ];

    // Map scene IDs to commands for scene entry
    private readonly sceneMap: { [key in Commands]: string } = {
        [Commands.KnownAccounts]: 'KNOWN_ACCOUNTS_SCENE',
        [Commands.TokenBalances]: 'TOKEN_BALANCES_SCENE',
        [Commands.TokenBalancesTs]: 'TOKEN_BALANCES_TS_SCENE',
        [Commands.WalletPnl]: 'WALLET_PNL_SCENE',
        [Commands.NftOwners]: 'NFT_COLLECTION_OWNERS_SCENE',
        [Commands.Tokens]: 'TOKENS_SCENE',
        [Commands.TokenHolders]: 'TOKEN_HOLDERS_SCENE',
        [Commands.TokenDetails]: 'TOKEN_DETAILS_SCENE',
        [Commands.TokenVolume]: 'TOKEN_VOLUME_SCENE',
        [Commands.TokenHoldersTs]: 'TOKEN_HOLDERS_TS_SCENE',
        [Commands.TokenTransfers]: 'TOKEN_TRANSFERS_SCENE',
        [Commands.TokenTrades]: 'TOKEN_TRADES_SCENE',
        [Commands.Programs]: 'PROGRAMS_SCENE',
        [Commands.ProgramTxCount]: 'PROGRAM_TX_COUNT_SCENE',
        [Commands.ProgramIxCount]: 'PROGRAM_IX_COUNT_SCENE',
        [Commands.ProgramActiveUsersTs]: 'PROGRAM_ACTIVE_USERS_TS_SCENE',
        [Commands.ProgramActiveUsers]: 'PROGRAM_ACTIVE_USERS_SCENE',
        [Commands.ProgramDetails]: 'PROGRAM_DETAILS_SCENE',
        [Commands.ProgramRanking]: 'PROGRAM_RANKING_SCENE',
        [Commands.PythAccounts]: 'PYTH_ACCOUNTS_SCENE',
        [Commands.PythPrice]: 'PYTH_PRICE_SCENE',
        [Commands.PythPriceTs]: 'PYTH_PRICE_TS_SCENE',
        [Commands.PythPriceOhlc]: 'PYTH_PRICE_OHLC_SCENE',
        [Commands.TokenOhlcv]: 'TOKEN_OHLCV_SCENE',
        [Commands.PythProduct]: 'PYTH_PRODUCT_SCENE',
        [Commands.DexAmm]: 'DEX_AMM_SCENE',
        [Commands.Markets]: 'MARKETS_SCENE',
        [Commands.HELP]: '',
        [Commands.MAIN_MENU]: '',
        [Commands.Cancel]: '',
    };

    /**
     * Detects the intended command from a user message
     * @param message The user's input message
     * @returns The detected command and scene ID or null if no match
     */
    detectIntent(message: string): { command: Commands; sceneId?: string } | null {
        if (!message || typeof message !== 'string') {
            return null;
        }

        const lowerMessage = message.toLowerCase().trim();
        let bestMatch: { command: Commands; score: number } | null = null;

        // Step 1: Check for exact or near-exact phrase matches
        for (const intent of this.intentMap) {
            if (intent.exactPhrases) {
                for (const phrase of intent.exactPhrases) {
                    const phraseLower = phrase.toLowerCase();
                    if (lowerMessage.includes(phraseLower)) {
                        // Exact match gets a high score
                        const score = phraseLower.length / lowerMessage.length;
                        if (!bestMatch || score > bestMatch.score) {
                            bestMatch = { command: intent.command, score };
                        }
                    }
                }
            }
        }

        // Step 2: Fallback to tokenized matching if no exact match
        if (!bestMatch || bestMatch.score < 0.7) {
            const tokens = this.tokenizer.tokenize(lowerMessage);
            const stemmedTokens = tokens.map(token => this.stemmer.stem(token));

            for (const intent of this.intentMap) {
                for (const keyword of intent.keywords) {
                    const keywordTokens = this.tokenizer.tokenize(keyword.toLowerCase());
                    const stemmedKeywordTokens = keywordTokens.map(token => this.stemmer.stem(token));

                    // Calculate match score based on overlapping stemmed tokens
                    const commonTokens = stemmedTokens.filter(token => stemmedKeywordTokens.includes(token));
                    let score = commonTokens.length / Math.max(stemmedKeywordTokens.length, 1);

                    // Boost score for longer keywords to prioritize specificity
                    score *= Math.min(keywordTokens.length / 5, 1.5);

                    if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
                        bestMatch = { command: intent.command, score };
                    }
                }
            }
        }

        if (bestMatch) {
            this.logger.debug(
                `Detected intent: ${bestMatch.command} with score ${bestMatch.score} for message: ${message}`,
            );
            return {
                command: bestMatch.command,
                sceneId: this.sceneMap[bestMatch.command] || undefined,
            };
        }

        this.logger.debug(`No intent detected for message: ${message}`);
        return null;
    }
}
