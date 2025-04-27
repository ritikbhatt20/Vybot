import { Injectable, Logger } from '@nestjs/common';
import { VybeApiService } from '../shared/vybe-api.service';
import { NftCollectionOwner } from '../../types';

@Injectable()
export class NftService {
    private readonly logger = new Logger(NftService.name);

    constructor(private readonly vybeApi: VybeApiService) { }

    async getCollectionOwners(collectionAddress: string): Promise<NftCollectionOwner[]> {
        const url = `/nft/collection-owners/${collectionAddress}`;

        this.logger.debug(`Fetching NFT collection owners for ${collectionAddress}`);

        try {
            const response = await this.vybeApi.get<{ data: NftCollectionOwner[] }>(url);
            this.logger.debug(`Found ${response.data?.length || 0} owners`);
            return response.data || [];
        } catch (error) {
            this.logger.error(`Failed to fetch NFT collection owners: ${error.message}`, error.stack);
            throw error;
        }
    }
}