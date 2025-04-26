// modules/tokens/tokens.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { Token } from '../../types';

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
}
