import moment from '~/moment/moment';
import { v4 } from 'uuid';

export type DatasetMetadataType = '_table' | '_image';
export type DatasetMetadataSourceType = 'GOOGLE_SHEETS' | 'FILE';

export interface DatasetMetadataEntity {
    _id: string;
    name: string;
    type: DatasetMetadataType;
    sourceType: DatasetMetadataSourceType;
    source: string;
    spreadsheetId?: string;
    sheetId?: string;
    inputsCount: number;
    outputsCount: number;
    size: number;
    columnsCount: number;
    isTemporary: boolean;
    createdTime: number;
    updatedTime: number;
}

export const createDatasetMetadataEntity = (source?: Partial<DatasetMetadataEntity>): DatasetMetadataEntity => ({
    _id: source?._id ?? v4(),
    name: source?.name ?? '',
    type: source?.type ?? '_table',
    sourceType: source?.sourceType ?? 'FILE',
    inputsCount: source?.inputsCount ?? 0,
    outputsCount: source?.outputsCount ?? 0,
    isTemporary: source?.isTemporary ?? true,
    source: source?.source ?? '',
    spreadsheetId: source?.spreadsheetId,
    sheetId: source?.sheetId,
    size: source?.size ?? 0,
    columnsCount: source?.columnsCount ?? 0,
    createdTime: moment().unix(),
    updatedTime: moment().unix(),
});
