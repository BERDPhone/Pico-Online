import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
const path = require('path');
const config = require('../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
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

export default router;