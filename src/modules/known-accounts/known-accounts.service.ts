import { Injectable } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { KnownAccount } from 'src/types';

@Injectable()
export class KnownAccountsService {
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
        if (params.labels) params.labels.forEach((label) => query.append('labels', label));
        if (params.entity) query.append('entityName', params.entity);
        if (params.entityId) query.append('entityId', params.entityId.toString());
        if (params.sortByAsc) query.append('sortByAsc', params.sortByAsc);
        if (params.sortByDesc) query.append('sortByDesc', params.sortByDesc);

        const url = `/account/known-accounts${query.toString() ? `?${query}` : ''}`;
        try {
            const response = await this.vybeApi.get<{ accounts: KnownAccount[] }>(url);
            return response.accounts;
        } catch (error) {
            console.error('Vybe API Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url,
            });
            throw error;
        }
    }
}
