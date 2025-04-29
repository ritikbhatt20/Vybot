import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { PythAccount, PythAccountsResponse, PythPrice, PythPriceError } from '../../types';

@Injectable()
export class PricesService {
    private readonly logger = new Logger(PricesService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getPythAccounts(params: {
        productId?: string;
        priceFeedId?: string;
    } = {}): Promise<PythAccount[]> {
        const query = new URLSearchParams();

        if (params.productId) query.append('productId', params.productId);
        if (params.priceFeedId) query.append('priceFeedId', params.priceFeedId);

        const url = `/price/pyth-accounts${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching Pyth accounts with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<PythAccountsResponse>(url);
            this.logger.debug(`Found ${response.data?.length || 0} Pyth accounts`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch Pyth accounts: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getPythPrice(priceFeedId: string): Promise<PythPrice> {
        const url = `/price/${priceFeedId}/pyth-price`;

        this.logger.debug(`Fetching Pyth price for priceFeedId: ${priceFeedId}`);

        try {
            const response = await this.vybeApi.get<PythPrice | PythPriceError>(url);
            this.logger.debug(`Fetched Pyth price data for ${priceFeedId}`);
            return response as PythPrice;
        } catch (error) {
            this.logger.error(`Failed to fetch Pyth price: ${error.message}`, error.stack);
            throw error;
        }
    }
}
