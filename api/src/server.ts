import { Server, Socket } from 'socket.io';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as http from 'http';
import { SerialPort, SpacePacketParser, ReadlineParser } from 'serialport';
import { ChangeSet, Text } from "@codemirror/state"
import { Update } from "@codemirror/collab"

const path = require('path');
const config = require('../../config.json')

const gitDir: string = `${process.cwd()}/gitrepo`;

console.log("gitDir:", gitDir);

const server = http.createServer();

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = []
// The current document
let doc = Text.of(["Start document"])
let pending: ((value: any) => void)[] = []

let io = new Server(server, {
	path: "/api",
	cors: {
		origin: config.siteUrl,
		methods: ["GET", "POST"]
	}
});

let currentBranch = "main"

const serialport = new SerialPort({ path: config.serialPort, baudRate: 115200 })
const parser = new ReadlineParser()
serialport.pipe(parser)
parser.on('data', (data) => {
	io.emit('uart', data);
})

serialport.on('error', (error) => {
	console.error(error);
})

// listening for connections from clients
io.on('connection', (socket: Socket) =>{
	console.log("getting connection");

	// socket.on('changeRemote', (params, callback) => {
	// 	config.gitRepository = params;
	// 	socket.emit('pull')
	// })
	
	socket.on('pullUpdates', (version: number) => {
		if (version < updates.length) {
			socket.emit("pullUpdateResponse", JSON.stringify(updates.slice(version)))
		} else {
			pending.push((updates) => { socket.emit('pullUpdateResponse', JSON.stringify(updates.slice(version))) });
		}
	})

	socket.on('pushUpdates', (version, docUpdates) => {
		docUpdates = JSON.parse(docUpdates);

		try {
			if (version != updates.length) {
				socket.emit('pushUpdateResponse', false);
			} else {
				for (let update of docUpdates) {
					// Convert the JSON representation to an actual ChangeSet
					// instance
					let changes = ChangeSet.fromJSON(update.changes)
					updates.push({changes, clientID: update.clientID})
					doc = changes.apply(doc)
				}
				socket.emit('pushUpdateResponse', true);

				while (pending.length) pending.pop()!(updates)
			}
		} catch (error) {
			console.error(error)
		}
	})

	socket.on('getDocument', () => {
		socket.emit('getDocumentResponse', updates.length, doc.toString());
	})

	socket.on('getStructure', (params, callback) => {
		// socket.emit('stdout', `Updating file structure`);
		let diretoryTreeToObj = function(dir: string, done: Function) {
			let results: File[] = [];

			fs.readdir(dir, function(err, list) {
				if (err)
					return done(err);

				let pending = list.length;

				if (!pending)
					return done(null, {name: path.basename(dir), type: 'folder', children: results});

				list.forEach(function(file) {
					file = path.resolve(dir, file);
					fs.stat(file, function(err, stat) {
						if (stat && stat.isDirectory()) {
							diretoryTreeToObj(file, function(err: any, res: File[]) {
								results.push({
									name: path.basename(file),
									type: 'folder',
									children: res
								});
								if (!--pending)
									done(null, results);
							});
						}
						else {
							results.push({
								type: 'file',
								name: path.basename(file)
							});
							if (!--pending)
								done(null, results);
						}
					});
				});
			});
		};

		let repo = fs.readdirSync(gitDir);
		config.gitBaseDir = repo[0];

		diretoryTreeToObj(`${gitDir}/${repo[0]}`, function(err: any, response: File[]) {
			try {
				if(err) {
					console.error(err);

					socket.emit('stdout', `Failed to get file structure`);
				} else {
					// const orderChildren = obj => {
					// 	obj.children.sort((a, b) => b.type.localeCompare(a.type));
					// 	if (obj.children.some(o => o.children.length)) {
					// 		obj.children.forEach(child => orderChildren(child));
					// 	}
					// 	return obj;
					// };

					const sortArray = (array: File[]) => {
						array.sort((a, b) => a.name.localeCompare(b.name));
						array.sort((a, b) => b.type.localeCompare(a.type));
						array.forEach(a => {
							if (a.children && a.children.length > 0)
								sortArray(a.children)
						})
						return array;
					}

					response = sortArray(response);

					socket.broadcast.emit('filestruct', {
						"name": config.gitBaseDir,
						"type": "folder",
						"children": response,
						"status": 200,
					});
					socket.emit('filestruct', {
						"name": config.gitBaseDir,
						"type": "folder",
						"children": response,
						"status": 200,
					});
				}
			} catch (erorr) {

				socket.broadcast.emit('filestruct', {
					"name": config.gitBaseDir,
					"type": "folder",
					"children": [],
					"status": 500,
				});
				socket.emit('filestruct', {
					"name": config.gitBaseDir,
					"type": "folder",
					"children": [],
					"status": 500,
				});

				socket.emit('stdout', `Failed to get file structure`);
			}
		});

	})

	socket.on('getBranch', (params, callback) => {
		simpleGit(`${gitDir}/${config.gitBaseDir}`)
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
		socket.broadcast.emit('pull', params);

		try {

			if (fs.existsSync(gitDir)) {
				fs.rmSync(gitDir, { recursive: true });
			}

			fs.mkdirSync(gitDir);

			const options = {
				baseDir: gitDir
			};

			// simpleGit(options).clean(CleanOptions.FORCE);

			let remote: string = config.gitRepository;

			if (params) {
				remote = params;
				config.gitRepository = remote;
				// gitDir = ${process.cwd()}/gitrepo/
			}

			simpleGit(gitDir)
				.clone(remote, { '--recurse-submodules': null })
				.then(() => {
					let repo = fs.readdirSync(gitDir);
					config.gitBaseDir = repo[0];

					socket.emit('stdout', "Successfully pulled " + config.gitBaseDir + " from github");
					socket.broadcast.emit('stdout', "Successfully pulled " + config.gitBaseDir + " from github");

					socket.emit('pullFinish');
					socket.broadcast.emit('pullFinish');

					listBranches();

				}).catch((err) => {
					throw err;
				});

		} catch (error) {
			console.error(error);
			socket.emit('stdout', "Error attempting to pull the repository");
			socket.broadcast.emit('stdout', "Error attempting to pull the repository");
		}
	})

	socket.on('branch', (params, callback) => {
		console.log("getting pull")

		// broadcasting data to all other connected clients
		socket.broadcast.emit('branch', params);

		console.log(`${gitDir}/${config.gitBaseDir}`);

		if (params) {
			// socket.emit('stdout', params);
			simpleGit(`${gitDir}/${config.gitBaseDir}`)
				.checkout(`remotes/origin/${params}`)
				.submoduleInit()
				.submoduleUpdate()
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
			simpleGit(`${gitDir}/${config.gitBaseDir}`)
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

	const listBranches = () => {
		simpleGit(`${gitDir}/${config.gitBaseDir}`)
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
				socket.emit('allBranches', allBranches);
				socket.broadcast.emit('allBranches', allBranches);

			}).catch((err) => {
				socket.emit('stdout', "Error attempting to branches from the repository");
				socket.broadcast.emit('stdout', "Error attempting to branches from the repository");
			});
	}

	socket.on('listBranches', (params, callback) => {
		listBranches();
	});

	socket.on('build', (params, callback) => {
		let programPath: string;
		if (config.buildTargetPath != "") {
			programPath = `${config.buildTargetPath}/${config.buildTarget}.elf`;
		} else {
			programPath = `${config.buildTarget}.elf`;
		}

		if (!fs.existsSync(`${gitDir}/${config.gitBaseDir}/build`)) {
			fs.mkdirSync(`${gitDir}/${config.gitBaseDir}/build`);
		}

		let child = spawn(`cd ${gitDir}/${config.gitBaseDir}/build && cmake .. && make ${config.buildTarget} && openocd -f interface/raspberrypi-swd.cfg -f target/rp2040.cfg -c "program ${programPath} verify reset exit"`, {
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
			const buffer = fs.readFileSync(`${gitDir}/${config.gitBaseDir}/${params}`);
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

	socket.on('changeTarget', (params, callback) => {
		params[0] = params[0] ?? "";
		params[1] = params[1] ?? "";
		config.buildTarget = params[0];
		config.buildTargetPath = params[1];

		socket.broadcast.emit('target', params);

		socket.emit('stdout', `Set executable to "${params[0]}" and path to "${params[1]}"`);
		socket.broadcast.emit('stdout', `Set executable to "${params[0]}" and path to "${params[1]}"`);

	});
})


const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server listening on port: ${port}`));

interface File {
	name: string; 
	type: string; 
	children?: File[];
}
