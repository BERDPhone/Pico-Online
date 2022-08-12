import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
const path = require('path');
const config = require('../../config.json')
const gitDir: string = `${process.cwd()}/${config.gitBaseDir}`;

const router = express.Router();

import pullRouter from './routes/pull';
import fileRouter from './routes/files';
import branchRouter from './routes/branch';
import buildRouter from './routes/build';

router.use('/pull', pullRouter);
router.use('/files', fileRouter);
router.use('/branch', branchRouter);
router.use('/build', buildRouter);

export default router;