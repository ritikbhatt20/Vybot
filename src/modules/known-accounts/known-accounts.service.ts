import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { KnownAccount, TokenBalanceResponse, TokenBalanceTimeSeries } from '../../types';
import { WalletPnlResponse } from '../../types';

@Injectable()
export class KnownAccountsService {
    private readonly logger = new Logger(KnownAccountsService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getKnownAccounts(params: {
        ownerAddress?: string;
        name?: string;
        labels?: string[];
        entity?: string;
        entityId?: number;
        sortByAsc?: string;
        sortByDesc?: string;
    }): Promise<KnownAccount[]> {
        const query = new URLSearchParams();

        if (params.ownerAddress) query.append('ownerAddress', params.ownerAddress);
        if (params.name) query.append('name', params.name);
        if (params.labels?.length)
            params.labels.forEach((label) => query.append('labels', label));
        if (params.entity) query.append('entityName', params.entity);
        if (params.entityId) query.append('entityId', params.entityId.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);

        const url = `/account/known-accounts${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching known accounts with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ accounts: KnownAccount[] }>(url);
            this.logger.debug(`Found ${response.accounts?.length || 0} accounts`);
            return response.accounts || [];
        } catch (error) {
            this.logger.error(`Failed to fetch known accounts: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenBalances(
        ownerAddress: string,
        params: {
            includeNoPriceBalance?: boolean;
            sortByAsc?: string;
            sortByDesc?: string;
            onlyVerified?: boolean;
            oneDayTradeMinimum?: number;
            oneDayTradeVolumeMinimum?: number;
            holderMinimum?: number;
            minAssetValue?: string;
            maxAssetValue?: string;
            limit?: number;
            page?: number;
        } = {}
    ): Promise<TokenBalanceResponse> {
        const query = new URLSearchParams();

        if (params.includeNoPriceBalance)
            query.append('includeNoPriceBalance', params.includeNoPriceBalance.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);
        if (params.onlyVerified) query.append('onlyVerified', params.onlyVerified.toString());
        if (params.oneDayTradeMinimum)
            query.append('oneDayTradeMinimum', params.oneDayTradeMinimum.toString());
        if (params.oneDayTradeVolumeMinimum)
            query.append('oneDayTradeVolumeMinimum', params.oneDayTradeVolumeMinimum.toString());
        if (params.holderMinimum)
            query.append('holderMinimum', params.holderMinimum.toString());
        if (params.minAssetValue) query.append('minAssetValue', params.minAssetValue);
        if (params.maxAssetValue) query.append('maxAssetValue', params.maxAssetValue);
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/account/token-balance/${ownerAddress}${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching token balances for ${ownerAddress} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<TokenBalanceResponse>(url);
            this.logger.debug(`Found ${response.data?.length || 0} token balances`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to fetch token balances: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenBalancesTimeSeries(ownerAddress: string, days?: number): Promise<TokenBalanceTimeSeries[]> {
        const query = new URLSearchParams();
        if (days) query.append('days', days.toString());

        const url = `/account/token-balance-ts/${ownerAddress}${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching token balances time series for account ${ownerAddress} with days: ${days || 'default'}`);

        try {
            const response = await this.vybeApi.get<{ data: TokenBalanceTimeSeries[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} token balance time series data points`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch token balances time series: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getWalletPnl(
        ownerAddress: string,
        params: {
            resolution?: '1d' | '7d' | '30d';
            tokenAddress?: string;
            sortByAsc?: string;
            sortByDesc?: string;
            limit?: number;
            page?: number;
        } = {}
    ): Promise<WalletPnlResponse> {
        const query = new URLSearchParams();

        if (params.resolution) query.append('resolution', params.resolution);
        if (params.tokenAddress) query.append('tokenAddress', params.tokenAddress);
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/account/pnl/${ownerAddress}${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching wallet PnL for ${ownerAddress} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<WalletPnlResponse>(url);
            this.logger.debug(`Found wallet PnL data with ${response.tokenMetrics?.length || 0} token metrics`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to fetch wallet PnL: ${error.message}`, error.stack);
            throw error;
        }
    }
}
