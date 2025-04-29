import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { PythAccount, PythAccountsResponse, PythPrice, PythPriceTsResponse, PythPriceOhlcResponse, PythProduct, DexAmmResponse, PythPriceError, DexAmmProgram, PythPriceOhlc } from '../../types';

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

    async getPythPriceTs(priceFeedId: string, params: {
        resolution?: string;
        timeStart?: number;
        timeEnd?: number;
        limit?: number;
        page?: number;
    } = {}): Promise<PythPrice[]> {
        const query = new URLSearchParams();

        if (params.resolution) query.append('resolution', params.resolution);
        if (params.timeStart) query.append('timeStart', params.timeStart.toString());
        if (params.timeEnd) query.append('timeEnd', params.timeEnd.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/price/${priceFeedId}/pyth-price-ts${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching Pyth price time series for priceFeedId: ${priceFeedId} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<PythPriceTsResponse | PythPriceError>(url);
            this.logger.debug(`Fetched ${response || 0} Pyth price time series data points for ${priceFeedId}`);
            return (response as PythPriceTsResponse).data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch Pyth price time series: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getPythPriceOhlc(priceFeedId: string, params: {
        resolution?: string;
        timeStart?: number;
        timeEnd?: number;
        limit?: number;
        page?: number;
    } = {}): Promise<PythPriceOhlc[]> {
        const query = new URLSearchParams();

        if (params.resolution) query.append('resolution', params.resolution);
        if (params.timeStart) query.append('timeStart', params.timeStart.toString());
        if (params.timeEnd) query.append('timeEnd', params.timeEnd.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());

        const url = `/price/${priceFeedId}/pyth-price-ohlc${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching Pyth OHLC for priceFeedId: ${priceFeedId} with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<PythPriceOhlcResponse | PythPriceError>(url);
            this.logger.debug(`Fetched ${response || 0} Pyth OHLC data points for ${priceFeedId}`);
            return (response as PythPriceOhlcResponse).data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch Pyth OHLC: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getPythProduct(productId: string): Promise<PythProduct> {
        const url = `/price/${productId}/pyth-product`;

        this.logger.debug(`Fetching Pyth product metadata for productId: ${productId}`);

        try {
            const response = await this.vybeApi.get<PythProduct | PythPriceError>(url);
            this.logger.debug(`Fetched Pyth product metadata for ${productId}`);
            return response as PythProduct;
        } catch (error) {
            this.logger.error(`Failed to fetch Pyth product metadata: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getDexAmmPrograms(): Promise<DexAmmProgram[]> {
        const url = `/price/programs`;

        this.logger.debug(`Fetching DEX and AMM programs`);

        try {
            const response = await this.vybeApi.get<DexAmmResponse>(url);
            this.logger.debug(`Fetched ${response.data?.length || 0} DEX and AMM programs`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch DEX and AMM programs: ${error.message}`, error.stack);
            throw error;
        }
    }
}
