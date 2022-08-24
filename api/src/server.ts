import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import * as morgan from 'morgan';
import apiRouter from './routes';
import { Server, Socket } from 'socket.io';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as http from 'http';

const path = require('path');
const config = require('../../config.json')

const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;
const app = express();

const server = http.createServer(app);

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

let io = new Server(server, {
	path: "/api/socket",
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

let currentBranch = "main"

// listening for connections from clients
io.on('connection', (socket: Socket) =>{
	console.log("getting connection");

	socket.on('getBranch', (params, callback) => {
		simpleGit(gitDir)
			.branch()
			.then((branches) => {
				if (branches.current.includes("origin/")) {
					let currentBranch = branches.current.replace("origin/", "");
					socket.emit("displayBranch", currentBranch);
				} else {
					socket.emit("displayBranch", currentBranch);
				}
			})
			.catch(error => {
				console.error(error);
			})
	})

	socket.on('clear', (params, callback) => {

		// send data back to client by using emit
		socket.emit('clear');

		// broadcasting data to all other connected clients
		socket.broadcast.emit('clear');
	})

	socket.on('pull', (params, callback) => {
		console.log("getting pull")

		// // broadcasting data to all other connected clients
		socket.broadcast.emit('pull');

		try {
			if (fs.existsSync(gitDir)) {
				fs.rmSync(gitDir, { recursive: true });
			}

			fs.mkdirSync(gitDir);

			const options = {
				baseDir: gitDir,
			};

			simpleGit(options).clean(CleanOptions.FORCE);

			const remote = config.gitRepository;

			simpleGit()
				.clone(remote)
				.then(() => {
					socket.emit('stdout', "Successfully pulled " + config.gitBaseDir + " from github");
					socket.broadcast.emit('stdout', "Successfully pulled " + config.gitBaseDir + " from github");
				}).catch((err) => {
					throw err;
				});

		} catch (error) {
			socket.emit('stdout', "Error attempting to pull the repository");
			socket.broadcast.emit('stdout', "Error attempting to pull the repository");
		}
	})

	socket.on('branch', (params, callback) => {
		console.log("getting pull")

		// broadcasting data to all other connected clients
		socket.broadcast.emit('branch', params);

		if (params) {
			// socket.emit('stdout', params);
			simpleGit(gitDir)
				.checkout(`remotes/origin/${params}`)
				.then(() => {
					socket.emit('stdout', `Successfully changed branch to ${params}`);
					socket.broadcast.emit('stdout', `Successfully changed branch to ${params}`);
					socket.emit('displayBranch', params)
					socket.broadcast.emit('displayBranch', params);
				})
				.catch((err) => {
					socket.emit('stdout', `Error attempting to change to ${params} branch`);
					socket.broadcast.emit('stdout', `Error attempting to change to ${params} branch`);
				});
		} else {
			simpleGit(gitDir)
				.branch()
				.then((branches) => {
					// remotes/origin/
					// console.log("branches: ", branches.all)
					let allBranches: string[] = [];
					branches.all.forEach(branch => {
						if (branch.includes("remotes/origin/")) {
							allBranches.push(branch.replace("remotes/origin/", ""));
						}
					})
					allBranches = allBranches.sort((a, b) => a.localeCompare(b));
					allBranches.forEach((branch) => {
						socket.emit('stdout', branch);
						socket.broadcast.emit('stdout', branch);
					})
				}).catch((err) => {
					socket.emit('stdout', "Error attempting to branches from the repository");
					socket.broadcast.emit('stdout', "Error attempting to branches from the repository");
				});
		}
	})

	socket.on('build', (params, callback) => {
		const child = spawn(`cd ${gitDir}/build && cmake .. && make ${config.buildTarget} && openocd -f interface/raspberrypi-swd.cfg -f target/rp2040.cfg -c "program src/os/${config.buildTarget}.elf verify reset exit"`, {
			shell: true
		});	

		child.stderr.on('data', function (data) {
			socket.emit('stdout', data.toString());
			socket.broadcast.emit('stdout', data.toString());
		});

		child.stdout.on('data', function (data) {
			socket.emit('stdout', data.toString());
			socket.broadcast.emit('stdout', data.toString());
		});

		child.on('exit', function (exitCode) {
			socket.emit('stdout', `Child exited with code: ${exitCode}`);
			socket.broadcast.emit('stdout', `Child exited with code: ${exitCode}`);
		});
	
	})

	socket.on('edit', (params, callback) => {
		try {
			const buffer = fs.readFileSync(`${gitDir}/${params}`);
			const fileContent = buffer.toString();

			socket.emit('stdout', `Displaying file in editor`);

			socket.emit('fileContents', fileContent)
		} catch (error) {
			if (params) {
				socket.emit('stdout', 'Incorrect file path provided');
			} else {
				socket.emit('stdout', 'No file path provided');
			}
		}	
	})
})



const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server listening on port: ${port}`));