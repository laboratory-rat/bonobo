export type DatasetTableSource = DatasetSourceGoogle | DatasetSourceFile;
export type DatasetTableSourceType = 'GOOGLE_SPREADSHEETS' | 'FILE';

interface DatasetSource {
    type: DatasetTableSourceType;
}

export interface DatasetSourceGoogle extends DatasetSource {
    type: 'GOOGLE_SPREADSHEETS';
    spreadsheetId: string;
    sheetId: string;
    link: string;
}

export interface DatasetSourceFile extends DatasetSource {
    type: 'FILE';
    fileName: string;
}
