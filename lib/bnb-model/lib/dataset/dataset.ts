import { DatasetTableSource } from './source';

export type Dataset = DatasetTable | DatasetImage;
export type DatasetType = '_table' | '_image';
export type DatasetTableColType = '_stringArray' | '_numberArray';

interface BaseDataset {
    type: DatasetType;
    name: string;
    size: number;
    createdTime: number;
    updatedTime: number;
}

export interface DatasetTable extends BaseDataset {
    type: '_table';
    source: DatasetTableSource;
    header: DatasetTableHeader[];
    body: unknown[][][];
}

export interface DatasetImage extends BaseDataset {
    type: '_image';
    body: DatasetImageCollectionItem[];
}

export interface DatasetTableHeader {
    type: DatasetTableColType;
    title: string;
    index: number;
    decimals: number;
    originIndex: number;
    isOutput: boolean;
}

export interface DatasetImageCollectionItem {
    imageSrc: string;
    width: number;
    height: number;
    label: string;
}
