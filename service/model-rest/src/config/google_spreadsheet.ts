export interface GoogleSpreadsheetConfig {
    apiKey: string;
}

export const createGoogleSpreadsheetConfig = (): GoogleSpreadsheetConfig => ({
    apiKey: process.env.GOOGLE_SPREADSHEET_API_KEY,
});
