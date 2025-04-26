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