import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
const path = require('path');
const config = require('../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

router.get('/message', (req: Request, res: Response, next: NextFunction) => {
	res.json({
		"message": "GET Request recieved!",
	});
});

router.post('/message', (req: Request, res: Response, next: NextFunction) => {
	res.json({
		"message": "Recieved",
	});
});

router.patch('/pull', function(req: Request, res: Response, next: NextFunction) {
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
				res.json({
					"status": 200,
					"message": "Successfully pulled " + config.gitBaseDir + " from github",
				});
			}).catch((err) => {
				throw err;
			});

	} catch (error) {
		res.json({
			"status": 500,
			"erorr": error
		})
		console.log(error);
	}
});

router.get('/files/structure', (req: Request, res: Response, next: NextFunction) => {
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

	diretoryTreeToObj(gitDir, function(err: any, response: File[]) {
		try {
			if(err) {
				console.error(err);

				res.json({
					"error": err,
					"status": 500
				});
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

				res.json({
					"name": config.gitBaseDir,
					"type": "folder",
					"children": response,
					"status": 200,
				});
			}
		} catch (erorr) {
			res.json({
				"name": config.gitBaseDir,
				"type": "folder",
				"children": [],
				"status": 500,
			});
		}
	});
	
});


router.post('/build', (req: Request, res: Response, next: NextFunction) => {
	res.json({
		"message": "Recieved",
	});
});

router.get('/branch', (req: Request, res: Response, next: NextFunction) => {
	simpleGit(gitDir)
		.branch()
		.then((branches) => {
			// remotes/origin/
			console.log("branches: ", branches.all)
			let allBranches: string[] = [];
			branches.all.forEach(branch => {
				if (branch.includes("remotes/origin/")) {
					allBranches.push(branch.replace("remotes/origin/", ""));
				}
			})

			res.json(allBranches.sort());
		}).catch((err) => {
			throw err;
		});
});


interface File {
	name: string; 
	type: string; 
	children?: File[];
}

export default router;