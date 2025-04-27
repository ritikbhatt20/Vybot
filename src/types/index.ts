export interface KnownAccount {
    ownerAddress: string;
    name: string | null;
    labels: string[];
    entity: string | null;
    entityId: number | null;
    logoUrl?: string | null;
    twitterUrl?: string | null;
    dateAdded?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface TokenBalance {
    symbol: string;
    name: string;
    mintAddress: string;
    amount: string;
    priceUsd: string;
    priceUsd1dChange: string;
    priceUsd7dTrend: string[];
    valueUsd: string;
    valueUsd1dChange: string;
    logoUrl: string;
    category: string;
    decimals: number;
    verified: boolean;
    slot: number;
}

export interface TokenBalanceResponse {
    date: number;
    ownerAddress: string;
    stakedSolBalanceUsd: string;
    stakedSolBalance: string;
    activeStakedSolBalanceUsd: string;
    activeStakedSolBalance: string;
    totalTokenValueUsd: string;
    totalTokenValueUsd1dChange: string;
    totalTokenCount: number;
    data: TokenBalance[];
}

export interface TokenBalanceTimeSeries {
    blockTime: number;
    tokenValue: string;
    stakeValue: string;
    stakeValueSol: string;
    systemValue: string;
}

export interface Token {
    symbol: string;
    name: string;
    mintAddress: string;
    price: number;
    price1d: number;
    price7d: number;
    decimal: number;
    logoUrl: string;
    category: string | null;
    subcategory: string | null;
    verified: boolean;
    updateTime: number;
    currentSupply: number;
    marketCap: number;
    tokenAmountVolume24h: number | null;
    usdValueVolume24h: number | null;
}

export interface TokenHolder {
    rank: number;
    ownerAddress: string;
    ownerName: string | null;
    ownerLogoUrl: string | null;
    tokenMint: string;
    tokenSymbol: string;
    tokenLogoUrl: string;
    balance: string;
    valueUsd: string;
    percentageOfSupplyHeld: number;
}

export interface TokenDetails {
    category: string;
    currentSupply: number;
    decimal: number;
    logoUrl: string;
    marketCap: number;
    mintAddress: string;
    name: string;
    price: number;
    price1d: number;
    price7d: number;
    subcategory: string;
    symbol: string;
    tokenAmountVolume24h: number;
    updateTime: number;
    usdValueVolume24h: number;
    verified: boolean;
}

export interface TokenVolume {
    amount: string;
    timeBucketStart: number;
    volume: string;
}

export interface TokenHoldersTimeSeries {
    holdersTimestamp: number;
    nHolders: number;
}

export interface TokenTransfer {
    signature: string;
    callingMetadata: Array<{
        callingInstructions: number[];
        ixName: string;
        callingProgram: string;
        programName: string;
    }>;
    senderTokenAccount: string | null;
    senderAddress: string;
    receiverTokenAccount: string | null;
    receiverAddress: string;
    mintAddress: string;
    feePayer: string;
    decimal: number;
    amount: number;
    slot: number;
    blockTime: number;
    price: string;
    calculatedAmount: string;
    valueUsd: string;
}

export interface TokenTrade {
    authorityAddress: string;
    blockTime: number;
    iixOrdinal: number;
    baseMintAddress: string;
    interIxOrdinal: number;
    ixOrdinal: number;
    marketId: string;
    quoteMintAddress: string;
    price: string;
    programId: string;
    signature: string;
    slot: number;
    txIndex: number;
    fee: string;
    feePayer: string;
    baseSize: string;
    quoteSize: string;
}

export interface Program {
    dau: number;
    entityName: string;
    friendlyName: string | null;
    idlUrl: string;
    instructions1d: number;
    labels: string[];
    logoUrl: string;
    name: string;
    newUsersChange1d: number;
    programDescription: string | null;
    programDetail: string | null;
    programId: string;
    transactions1d: number;
}

export interface ProgramRanking {
    programRank: number;
    programId: string;
    score: number;
    programName: string;
}

export interface ProgramTxCount {
    programId: string;
    transactionsCount: number;
    blockTime: number;
}

export interface ProgramIxCount {
    programId: string;
    instructionsCount: number;
    blockTime: number;
}

export interface ProgramActiveUsers {
    programId: string;
    dau: number;
    blockTime: number;
}

export interface ProgramActiveUser {
    programId: string;
    wallet: string;
    transactions: number;
    instructions: number;
}

export interface TokenVolumeWizardState {
    mintAddress?: string;
    startTime?: number;
    endTime?: number;
    interval?: string;
}

export interface TokenHoldersWizardState {
    mintAddress?: string;
    startTime?: number;
    endTime?: number;
}

export interface TokenTransfersWizardState {
    mintAddress?: string;
    timeStart?: number;
    timeEnd?: number;
    minAmount?: number;
    maxAmount?: number;
}

export interface TokenTradesWizardState {
    mintAddress?: string;
    timeStart?: number;
    timeEnd?: number;
    resolution?: string;
}

export interface ProgramsWizardState {
    labels?: string[];
}

export interface ProgramTxCountWizardState {
    programAddress?: string;
    range?: string;
}

export interface ProgramIxCountWizardState {
    programAddress?: string;
    range?: string;
}

export interface ProgramActiveUsersTsWizardState {
    programAddress?: string;
    range?: string;
}

export interface ProgramActiveUsersWizardState {
    programAddress?: string;
    days?: number;
    sortByAsc?: string;
    sortByDesc?: string;
}

export interface ProgramDetailsWizardState {
    programAddress?: string;
}

export interface ProgramRankingWizardState {
    limit?: number;
    interval?: '1d' | '7d' | '30d';
    date?: number;
}

export interface TokenBalancesTsWizardState {
    ownerAddress?: string;
    days?: number;
}

export interface WalletPnlResponse {
    summary: {
        winRate: number;
        realizedPnlUsd: number;
        unrealizedPnlUsd: number;
        uniqueTokensTraded: number;
        averageTradeUsd: number;
        tradesCount: number;
        winningTradesCount: number;
        losingTradesCount: number;
        tradesVolumeUsd: number;
        bestPerformingToken: string | null;
        worstPerformingToken: string | null;
        pnlTrendSevenDays: number[];
    };
    tokenMetrics: Array<{
        tokenAddress: string;
        tokenSymbol: string;
        buysTransactionCount: number;
        buysTokenAmount: number;
        buysVolumeUsd: number;
        sellsTransactionCount: number;
        sellsTokenAmount: number;
        sellsVolumeUsd: number;
        realizedPnlUsd: number;
        unrealizedPnlUsd: number;
    }>;
}

export interface WalletPnlWizardState {
    ownerAddress?: string;
    resolution?: '1d' | '7d' | '30d';
}

export interface NftCollectionOwner {
    owner: string;
    amount: number;
}
