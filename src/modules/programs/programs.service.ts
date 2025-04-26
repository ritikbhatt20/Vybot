import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { Program, ProgramTxCount } from '../../types';

@Injectable()
export class ProgramsService {
    private readonly logger = new Logger(ProgramsService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getPrograms(params: {
        labels?: string[];
        limit?: number;
        page?: number;
        sortByAsc?: string;
        sortByDesc?: string;
    } = {}): Promise<Program[]> {
        const query = new URLSearchParams();

        if (params.labels && params.labels.length > 0) {
            query.append('labels', params.labels.join(','));
        }
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.page) query.append('page', params.page.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);

        const url = `/programs${query.toString() ? `?${query}` : ''}`;

        this.logger.debug(`Fetching programs with params: ${JSON.stringify(params)}`);

        try {
            const response = await this.vybeApi.get<{ data: Program[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} programs`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch programs: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getProgramTxCount(programAddress: string, range: string): Promise<ProgramTxCount[]> {
        const query = new URLSearchParams();
        query.append('range', range);

        const url = `/program/${programAddress}/transactions-count-ts?${query}`;

        this.logger.debug(`Fetching transaction count time series for program ${programAddress} with range: ${range}`);

        try {
            const response = await this.vybeApi.get<{ data: ProgramTxCount[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} transaction count data points`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch transaction count time series: ${error.message}`, error.stack);
            throw error;
        }
    }
}