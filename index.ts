import express from 'express';
import "reflect-metadata";
import { PORT, URL_FRONTEND} from './config';
import { AppDataSource } from './database';
import bodyParser from 'body-parser';
import cors from 'cors';

import contestRoutes from './routers/ContestRouter';

const app = express();

app.use(cors({
    origin: URL_FRONTEND
}));

app.use(bodyParser.json());

// Routes
app.use('/contest', contestRoutes);


const run = async () => {
    try {
        await AppDataSource.initialize();
    }
    catch (e: unknown) {
        if (e instanceof Error) {
            console.log(e.message);
        }
        else console.log("Error during Data Source initialization");
    }
    app.listen(PORT, () => console.log(`Listening in port ${PORT}`));
};

run();