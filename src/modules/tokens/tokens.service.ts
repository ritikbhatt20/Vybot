import { Injectable, Logger, HttpException } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { Token, TokenHolder, TokenDetails, TokenVolume, TokenHoldersTimeSeries, TokenTransfer } from '../../types';

@Injectable()
export class TokensService {
    private readonly logger = new Logger(TokensService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getTokens(params: {
        sortByAsc?: string;
        sortByDesc?: string;
        limit?: number;
        page?: number;
    } = {}): Promise<Token[]> {
        const query = new URLSearchParams();

        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/tokens${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching tokens with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ data: Token[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} tokens`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch tokens: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTopTokenHolders(
        mintAddress: string,
        params: {
            page?: number;
            limit?: number;
            sortByAsc?: string;
            sortByDesc?: string;
        } = {}
    ): Promise<TokenHolder[]> {
        const query = new URLSearchParams();

        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);

        const url = `/token/${mintAddress}/top-holders${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching top token holders for mint ${mintAddress} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ data: TokenHolder[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} top token holders`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch top token holders: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenDetails(mintAddress: string): Promise<TokenDetails> {
        const url = `/token/${mintAddress}`;

        this.logger.debug(`Fetching token details for mint ${mintAddress}`);

        try {
            const response = await this.vybeApi.get<TokenDetails>(url);
            this.logger.debug(`Fetched token details for ${mintAddress}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to fetch token details: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenVolumeTimeSeries(
        mintAddress: string,
        params: {
            startTime?: number;
            endTime?: number;
            interval?: string;
            limit?: number;
            page?: number;
        } = {}
    ): Promise<TokenVolume[]> {
        const query = new URLSearchParams();

        if (params.startTime) query.append('startTime', params.startTime.toString());
        if (params.endTime) query.append('endTime', params.endTime.toString());
        if (params.interval) query.append('interval', params.interval);
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/token/${mintAddress}/transfer-volume${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching token volume time series for mint ${mintAddress} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ data: TokenVolume[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} volume data points`);
            return response.data || [];
        } catch (error) {
            if (error.response?.data?.message?.includes('Request has exceeded allowed time limit')) {
                throw new HttpException(
                    'Request time range is too large. Please refine your start and end times.',
                    408
                );
            }
            this.logger.error(`Failed to fetch token volume time series: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenHoldersTimeSeries(
        mintAddress: string,
        params: {
            startTime?: number;
            endTime?: number;
            interval?: string;
            limit?: number;
            page?: number;
        } = {}
    ): Promise<TokenHoldersTimeSeries[]> {
        const query = new URLSearchParams();

        if (params.startTime) query.append('startTime', params.startTime.toString());
        if (params.endTime) query.append('endTime', params.endTime.toString());
        query.append('interval', params.interval || 'day'); // Default to 'day' as per API
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/token/${mintAddress}/holders-ts${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching token holders time series for mint ${mintAddress} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ data: TokenHoldersTimeSeries[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} holders data points`);
            return response.data || [];
        } catch (error) {
            if (error.response?.data?.message?.includes('Request has exceeded allowed time limit')) {
                throw new HttpException(
                    'Request time range is too large. Please refine your start and end times.',
                    408
                );
            }
            this.logger.error(`Failed to fetch token holders time series: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getTokenTransfers(params: {
        mintAddress?: string;
        timeStart?: number;
        timeEnd?: number;
        minAmount?: number;
        maxAmount?: number;
        page?: number;
        limit?: number;
        sortByAsc?: string;
        sortByDesc?: string;
    } = {}): Promise<TokenTransfer[]> {
        const query = new URLSearchParams();

        if (params.mintAddress) query.append('mintAddress', params.mintAddress);
        if (params.timeStart) query.append('timeStart', params.timeStart.toString());
        if (params.timeEnd) query.append('timeEnd', params.timeEnd.toString());
        if (params.minAmount) query.append('minAmount', params.minAmount.toString());
        if (params.maxAmount) query.append('maxAmount', params.maxAmount.toString());
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);

        const url = `/token/transfers${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching token transfers with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ transfers: TokenTransfer[] }>(url);
            this.logger.debug(`Found ${response.transfers?.length || 0} transfer transactions`);
            return response.transfers || [];
        } catch (error) {
            this.logger.error(`Failed to fetch token transfers: ${error.message}`, error.stack);
            throw error;
        }
    }
}
