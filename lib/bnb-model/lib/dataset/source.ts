export type DatasetSourceType = DatasetSourceGoogle | DatasetSourceFile;

interface DatasetSource {
    type: 'GOOGLE_SPREADSHEETS' | 'FILE';
}

export interface DatasetSourceGoogle extends DatasetSource {
    type: 'GOOGLE_SPREADSHEETS';
    spreadsheetId: string;
    sheetId: string;
}

export interface DatasetSourceFile extends DatasetSource {
    type: 'FILE';
    fileName: string;
}
