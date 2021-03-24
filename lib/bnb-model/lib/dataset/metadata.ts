import { DatasetSourceType } from './source';

export type DatasetColType = DatasetColTypeNumber | DatasetColTypeString;

interface BaseDatasetColType {
    type: 'NUMBER_ARRAY' | 'STRING_ARRAY';
}

export interface DatasetColTypeNumber extends BaseDatasetColType {
    type: 'NUMBER_ARRAY';
}

export interface DatasetColTypeString extends BaseDatasetColType {
    type: 'STRING_ARRAY';
}

export interface DatasetMetadata {
    id: string;
    name: string;
    userID: string;
    header: DatasetMetadataHeader[];
    examples: DatasetMetadataCol[];
    size: number;
    datasetReference: string;
    sourceType: DatasetSourceType;
    sourceReference: string;
    isTemporary: boolean;
    isArchived: boolean;
    createdTime: number;
    updatedTime: number;
    lastSyncTime?: number;
    archivedTime?: number;
}

export interface DatasetMetadataHeader {
    title: string;
    index: number;
    decimals: number;
    originIndex: number;
    type: DatasetColType;
    isOutput: boolean;
}

export interface DatasetMetadataCol {
    value: DatasetMetadataCell[];
}

export interface DatasetMetadataCell {
    value: unknown[];
}
