import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { KnownAccount } from '../../types';

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
        if (params.labels?.length) params.labels.forEach((label) => query.append('labels', label));
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
}
