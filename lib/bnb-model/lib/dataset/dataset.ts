import { DatasetMetadataHeader } from './metadata';

export interface Dataset {
    id: string;
    name: string;
    metadataID: string;
    userID: string;
    header: DatasetMetadataHeader[];
    body: unknown[][][];
    createdTime: number;
    updatedTime: number;
}
