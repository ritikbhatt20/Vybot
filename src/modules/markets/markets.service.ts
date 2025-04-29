import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { MarketsResponse, PythPriceError } from '../../types';

@Injectable()
export class MarketsService {
    private readonly logger = new Logger(MarketsService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getMarkets(params: {
        programId: string;
        page?: number;
        limit?: number;
    }): Promise<MarketsResponse['data']> {
        const query = new URLSearchParams();
        query.append('programId', params.programId);
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());

        const url = `/price/markets?${query.toString()}`;

        this.logger.debug(`Fetching markets with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<MarketsResponse | PythPriceError>(url);
            if ('code' in response) {
                throw new Error(response.message);
            }
            this.logger.debug(`Fetched ${response.data?.length || 0} markets`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch markets: ${error.message}`, error.stack);
            throw error;
        }
    }
}