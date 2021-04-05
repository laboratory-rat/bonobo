import express from 'express';
import dotenv from 'dotenv';
import v1 from './controller/v1';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.SERVICE_PORT || 8080;

app.use(
    cors({
        origin: '*',
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    })
);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.send('Hello world 1');
});

app.use('/v1', v1);

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
