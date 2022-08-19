import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import * as morgan from 'morgan';
import apiRouter from './routes';

const app = express();

app.use(helmet())
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.disable('x-powered-by')

app.use('/api', apiRouter);

app.use((req: Request, res: Response, next: NextFunction): void => {
	res.status(404).send("Sorry can't find that!")
})

// custom error handler
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server listening on port: ${port}`));
