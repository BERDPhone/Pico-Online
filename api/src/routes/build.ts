import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as child from 'child_process';

const path = require('path');
const config = require('../../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
	child.exec(`cd ${gitDir}/build && PICO_BOARD=pico_w cmake .. && make ${config.buildTarget} && openocd -f interface/raspberrypi-swd.cfg -f target/rp2040.cfg -c "program pico_w/blink/picow_blink.elf verify reset exit"`, (error: child.ExecException, stdout: string, stderr: string) => {
		if (error) {
			console.log(`error: ${error.message}`);
			res.json({
				"status": 500,
				"message": error.message,
			});
			return;
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			res.json({
				"status": 500,
				"message": stderr,
			});
			return;
		}
		res.json({
			"status": 200,
			"message": stdout,
		});
		console.log(`stdout: ${stdout}`);
	});
});

export default router;