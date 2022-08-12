import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

const path = require('path');
const config = require('../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
	res.json({
		"message": "Recieved",
	});
});

export default router;