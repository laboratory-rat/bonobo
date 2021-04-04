import { createGoogleSpreadsheetConfig } from './../config/google_spreadsheet';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export const createGoogleSpreadsheetReader = async (
    id: string
): Promise<GoogleSpreadsheet> => {
    const config = createGoogleSpreadsheetConfig();
    const doc = new GoogleSpreadsheet(id);
    doc.useApiKey(config.apiKey);
    await doc.loadInfo();
    return doc;
};
