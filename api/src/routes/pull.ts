import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
const path = require('path');
const config = require('../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

router.patch('/', function(req: Request, res: Response, next: NextFunction) {
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

export default router;