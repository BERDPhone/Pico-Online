import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import * as morgan from 'morgan';
import apiRouter from './routes';
import { Server, Socket } from 'socket.io';

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
const server = app.listen(port, () => console.log(`Server listening on port: ${port}`));

let io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

// listening for connections from clients
io.on('connection', (socket: Socket) =>{
	console.log("getting connection");
	
	// listening to events from client
	socket.on('ping', (params, callback) => {

		// send data back to client by using emit
		socket.emit('pong');

		// broadcasting data to all other connected clients
		socket.broadcast.emit('pong');
	})

	socket.on('clear', (params, callback) => {

		// send data back to client by using emit
		socket.emit('clear');

		// broadcasting data to all other connected clients
		socket.broadcast.emit('clear');
	})

	socket.on('pull', (params, callback) => {
		console.log("getting pull")
		// send data back to client by using emit
		socket.emit('pull');

		// // broadcasting data to all other connected clients
		// socket.broadcast.emit('pull');
	})
})


