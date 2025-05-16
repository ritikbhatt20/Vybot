import { Injectable, Logger } from '@nestjs/common';
import { WordTokenizer, PorterStemmer } from 'natural';
import { Commands } from '../../enums/commands.enum';
import { isValidSolanaAddress } from '../../utils';

@Injectable()
export class NlpService {
    private readonly logger = new Logger(NlpService.name);
    private readonly tokenizer = new WordTokenizer();
    private readonly stemmer = PorterStemmer;

    private readonly tokenMap: { [key: string]: string } = {
        sol: 'So11111111111111111111111111111111111111112', // Wrapped SOL
        solana: 'So11111111111111111111111111111111111111112', // Alias for Wrapped SOL
        usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Tether USD
        usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USD Coin
        bonk: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
        link: 'CWE8jPTUYhdCTZYWPTe1o5DFq8a4sCKSKi17dMZrCNd9', // Chainlink
        ray: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
        raydium: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Alias for Raydium
        jup: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // Jupiter
        jupiter: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // Alias for Jupiter
        pyth: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // Pyth Network
        grt: '7z4WPA4tV5QhQNq2ZJ2bA3HuW51tN7d2bAcuZPx2NDuC', // The Graph (Note: Limited presence on Solana)
        atlas: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHyiRzV', // Star Atlas
        inj: '5BzvWG6RPR9N83z3DXD7EDd5DvaW4zCYanCmB7oYd1fP', // Injective (Note: Cross-chain, verify usage)
        fart: '9vTapS6W2uz3o2qQ3wSLCxT14vYV8tVXb7k4FMsqSL5', // Fart (Less common, retained as provided)
        orca: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // Orca
        wif: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // Dogwifhat
        fartcoin: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // Fartcoin
        srm: 'SRMuApVNdxXekkYD7kqFN2pYcP4bG3bD7DJYMiu3V33', // Serum
        msol: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // Marinade Staked SOL
        saber: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', // Saber
        fida: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp', // Bonfida
        step: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT', // Step Finance
        cope: '8HGyAAB1yoM1ttS7JhaC9HswDz3JG8C9nPDyIES191ix', // COPE
        popcat: '7GCihgDB8feCsgd7omT4LMf3VH6tNpeA4QJ6KRc4V3eN', // Popcat
        shdw: 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y', // Shadow Token
        slnd: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp', // Solend
        star: 'Po1mYGGYK5fW8qUKrEvD8HGjR6tW8JLT44U9z8Lzk2', // StarLaunch
        mnde: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey', // Marinade
        hnt: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', // Helium
        audius: '9LzCMqDgTKJz9Drzqnpgee3SGa89up3a247ypqHcQkK', // Audius
        kin: 'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6', // Kin
    };

    private readonly programMap: { [key: string]: string } = {
        serum: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', // Serum DEX
        raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
        orca: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca DEX
        saber: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', // Saber Protocol
        mango: 'mv3ekLzLbnVPNxjBw5r7V3NN8A5JbfmAcA6rrVMCQfs', // Mango Markets
        jupiter: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter Aggregator
        marinade: 'MarBmsSgKXdrN1egZf5sqe1TMThFZxD8Vq9Z6a17g5', // Marinade Finance
        solend: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', // Solend Lending
        drift: 'dRiftyHA39Xt7KukA9PyLP4AfZciU3X2Z3bCnyFomV', // Drift Protocol
        metaplex: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metaplex NFT
        squad: 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf', // Squads Protocol
        openbook: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', // OpenBook DEX
        aldebaran: 'ALBRvN1uU3y8qV7jw2uUZYz9mZ3gUY4e2kA2FRoUJoVR', // Aldebaran
        kamino: 'KLend2g3cP87fffoy8q1mQqGKjCHnf66L4Lvpm7Su8f', // Kamino Finance
        mercurial: 'MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky', // Mercurial Finance
        token: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
        token2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022 Program
        associatedtoken: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
        system: '11111111111111111111111111111111', // System Program
        stake: 'Stake11111111111111111111111111111111111111', // Stake Program
        pyth: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH', // Pyth Oracle Program
        wormhole: 'worm2ZoG2kUd4vFXhvjh93UX40H55xMofA6MNewszfDid', // Wormhole Bridge
        switchboard: 'SW1TCH7qEPTdLsDHRgPuAbEkxQECbBjRZsu4ESVQRhg', // Switchboard Oracle
        lido: 'CrX7kMhLC3cSsXJdT7JDgfyhA3Er7T4hJff8A93Zf2vw', // Lido for Solana
        zeta: 'ZETAx4NhZ81f6P8nuoQgsyA1gqX8sG6voU8Y4R5K4s5', // Zeta Markets
        phoenix: 'PHX4pJykNDTuH7M2hG5q4hDHozrJQMvJ7y3QWpni2F3', // Phoenix Protocol
    };

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
            command: Commands.TokenOhlcv,
            keywords: ['token ohlcv', 'ohlcv data', 'token price chart'],
            exactPhrases: ['token ohlcv', 'ohlcv data'],
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
            command: Commands.TokenPrice,
            keywords: ['token price', 'token price change', 'price of token'],
            exactPhrases: ['token price'],
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
        {
            command: Commands.Alerts,
            keywords: ['alerts', 'price alerts', 'token alerts', 'notifications', 'alert settings', 'price notifications', 'manage alerts', 'view alerts', 'check alerts', 'my alerts', 'set alert', 'create alert', 'add alert', 'remove alert', 'delete alert', 'price tracking'],
            exactPhrases: ['alerts', 'price alerts', 'token alerts', 'my alerts'],
        },
        {
            command: Commands.PercentAlerts,
            keywords: ['percentage alerts', 'percent alerts', 'percentage price alerts', 'percent price alerts', 'percentage change alerts', 'percent change alerts', 'price change alerts'],
            exactPhrases: ['percentage alerts', 'percent alerts', 'price change alerts'],
        },
        {
            command: Commands.Patterns,
            keywords: ['patterns', 'chart patterns', 'technical patterns', 'trading patterns', 'pattern recognition', 'pattern alerts'],
            exactPhrases: ['chart patterns', 'pattern recognition'],
        },
        {
            command: Commands.HeadAndShoulders,
            keywords: ['head and shoulders', 'head & shoulders', 'h&s pattern', 'head shoulders pattern'],
            exactPhrases: ['head and shoulders', 'head & shoulders'],
        },
        {
            command: Commands.DoubleTopBottom,
            keywords: ['double top', 'double bottom', 'double top bottom', 'double patterns'],
            exactPhrases: ['double top', 'double bottom'],
        },
        {
            command: Commands.TrianglePatterns,
            keywords: ['triangle patterns', 'ascending triangle', 'descending triangle', 'symmetric triangle'],
            exactPhrases: ['triangle patterns', 'ascending triangle', 'descending triangle'],
        },
        {
            command: Commands.FlagsAndPennants,
            keywords: ['flags and pennants', 'flag patterns', 'pennant patterns', 'flags pennants'],
            exactPhrases: ['flags and pennants', 'flag patterns', 'pennant patterns'],
        },
    ];

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
        [Commands.TokenOhlcv]: 'TOKEN_OHLCV_SCENE',
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
        [Commands.PythProduct]: 'PYTH_PRODUCT_SCENE',
        [Commands.DexAmm]: 'DEX_AMM_SCENE',
        [Commands.Markets]: 'MARKETS_SCENE',
        [Commands.TokenPrice]: 'TOKEN_PRICE_SCENE',
        [Commands.Alerts]: 'ALERTS_SCENE',
        [Commands.PercentAlerts]: 'ALERTS_SCENE',
        [Commands.HELP]: '',
        [Commands.MAIN_MENU]: '',
        [Commands.Cancel]: '',
        [Commands.Patterns]: 'PATTERN_RECOGNITION_SCENE',
        [Commands.HeadAndShoulders]: 'PATTERN_RECOGNITION_SCENE',
        [Commands.DoubleTopBottom]: 'PATTERN_RECOGNITION_SCENE',
        [Commands.TrianglePatterns]: 'PATTERN_RECOGNITION_SCENE',
        [Commands.FlagsAndPennants]: 'PATTERN_RECOGNITION_SCENE',
    };

    detectIntent(message: string): { command: Commands; sceneId?: string; mintAddress?: string; programAddress?: string } | null {
        if (!message || typeof message !== 'string') {
            this.logger.debug(`Invalid input: ${message}`);
            return null;
        }

        const lowerMessage = message.toLowerCase().trim();
        let bestMatch: { command: Commands; score: number } | null = null;
        let extractedToken: string | null = null;
        let extractedProgram: string | null = null;

        this.logger.debug(`Processing message: ${lowerMessage}`);

        // Step 1: Check for exact or near-exact phrase matches
        for (const intent of this.intentMap) {
            if (intent.exactPhrases) {
                for (const phrase of intent.exactPhrases) {
                    const phraseLower = phrase.toLowerCase();
                    if (lowerMessage.includes(phraseLower)) {
                        const score = phraseLower.length / lowerMessage.length;
                        if (!bestMatch || score > bestMatch.score) {
                            bestMatch = { command: intent.command, score };
                            // Extract token or program after "of"
                            const ofMatch = lowerMessage.match(/of\s+(.+)/);
                            if (ofMatch) {
                                const entity = ofMatch[1].trim();
                                if ([Commands.TokenHolders, Commands.TokenDetails, Commands.TokenTrades, Commands.TokenHoldersTs, Commands.TokenOhlcv, Commands.TokenTransfers, Commands.TokenVolume, Commands.TokenPrice].includes(intent.command)) {
                                    extractedToken = entity;
                                } else if ([Commands.ProgramTxCount, Commands.ProgramIxCount, Commands.ProgramActiveUsersTs, Commands.ProgramActiveUsers, Commands.ProgramDetails].includes(intent.command)) {
                                    extractedProgram = entity;
                                }
                            }
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

                    const commonTokens = stemmedTokens.filter(token => stemmedKeywordTokens.includes(token));
                    let score = commonTokens.length / Math.max(stemmedKeywordTokens.length, 1);
                    score *= Math.min(keywordTokens.length / 5, 1.5);

                    if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
                        bestMatch = { command: intent.command, score };
                        const ofMatch = lowerMessage.match(/of\s+(.+)/);
                        if (ofMatch) {
                            const entity = ofMatch[1].trim();
                            if ([Commands.TokenHolders, Commands.TokenDetails, Commands.TokenTrades, Commands.TokenHoldersTs, Commands.TokenOhlcv, Commands.TokenTransfers, Commands.TokenVolume, Commands.TokenPrice].includes(intent.command)) {
                                extractedToken = entity;
                            } else if ([Commands.ProgramTxCount, Commands.ProgramIxCount, Commands.ProgramActiveUsersTs, Commands.ProgramActiveUsers, Commands.ProgramDetails].includes(intent.command)) {
                                extractedProgram = entity;
                            }
                        }
                    }
                }
            }
        }

        if (!bestMatch) {
            this.logger.debug(`No intent detected for message: ${message}`);
            return null;
        }

        // Step 3: Resolve token to mint address if extracted
        let mintAddress: string | undefined;
        if (extractedToken && [Commands.TokenHolders, Commands.TokenDetails, Commands.TokenTrades, Commands.TokenHoldersTs, Commands.TokenOhlcv, Commands.TokenTransfers, Commands.TokenVolume, Commands.TokenPrice].includes(bestMatch.command)) {
            const normalizedToken = extractedToken.toLowerCase().trim();
            if (isValidSolanaAddress(normalizedToken)) {
                mintAddress = normalizedToken;
                this.logger.debug(`Direct token address detected: ${mintAddress}`);
            } else if (this.tokenMap[normalizedToken]) {
                mintAddress = this.tokenMap[normalizedToken];
                this.logger.debug(`Token mapped: ${normalizedToken} -> ${mintAddress}`);
            } else {
                this.logger.warn(`No token found in tokenMap for: ${normalizedToken}`);
            }
        }

        // Step 4: Resolve program to program address if extracted
        let programAddress: string | undefined;
        if (extractedProgram && [Commands.ProgramTxCount, Commands.ProgramIxCount, Commands.ProgramActiveUsersTs, Commands.ProgramActiveUsers, Commands.ProgramDetails].includes(bestMatch.command)) {
            const normalizedProgram = extractedProgram.toLowerCase().trim();
            if (isValidSolanaAddress(normalizedProgram)) {
                programAddress = normalizedProgram;
                this.logger.debug(`Direct program address detected: ${programAddress}`);
            } else if (this.programMap[normalizedProgram]) {
                programAddress = this.programMap[normalizedProgram];
                this.logger.debug(`Program mapped: ${normalizedProgram} -> ${programAddress}`);
            } else {
                this.logger.warn(`No program found in programMap for: ${normalizedProgram}`);
            }
        }

        this.logger.debug(
            `Detected intent: ${bestMatch.command} with score ${bestMatch.score} for message: ${message}` +
            (mintAddress ? `, mintAddress: ${mintAddress}` : '') +
            (programAddress ? `, programAddress: ${programAddress}` : '')
        );

        return {
            command: bestMatch.command,
            sceneId: this.sceneMap[bestMatch.command] || undefined,
            mintAddress,
            programAddress,
        };
    }
}
