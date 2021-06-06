import { DatasetTableColType } from '~/bnb-model/lib/dataset/dataset';
import { DatasetMetadataEntity } from '@/infrastructure/entity/dataset_metadata_entity';

export interface DatasetCreateGooglesheetsModel {
    id: string;
}

export interface DatasetTablePreviewModel {
    id: string;
    name: string;
    columns: {
        index: number;
        originIndex: number;
        name: string;
        examples: unknown[];
        type: DatasetTableColType;
        decimals?: number;
    }[];
    spreadsheetId?: string;
    sheetId?: string;
}

export interface DatasetTableApproveModel {
    id: string;
    name: string;
    columns: {
        index: number;
        originIndex: number;
        title: string;
        type: DatasetTableColType;
        decimals?: number;
        isOutput: boolean;
    }[];
}

export interface DatasetFindResponse {
    skip: number;
    limit: number;
    total: number;
    list: DatasetMetadataEntity[];
}

export interface DatasetFilterModel {
    search: Partial<DatasetMetadataEntity>;
    sort: keyof DatasetMetadataEntity;
    desc: boolean;
}
