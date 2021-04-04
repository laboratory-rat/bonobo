import express from 'express';
import dotenv from 'dotenv';
import v1 from './controller/v1';
import { createGoogleSpreadsheetReader } from './connector/google_spreadsheet';

dotenv.config();

const app = express();
const port = process.env.SERVICE_PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello world 1');
});

app.use('/v1', v1);

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
