export interface KnownAccount {
    ownerAddress: string;
    name: string | null;
    labels: string[];
    entity: string | null; 
    entityId: number | null;
    logoUrl?: string | null;
    twitterUrl?: string | null;
    dateAdded?: string;
}