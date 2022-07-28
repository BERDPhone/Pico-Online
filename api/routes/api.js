var express = require('express');
var router = express.Router();
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json')
const gitDir = `${process.cwd()}/${config.gitBaseDir}`;

/* 
GET norsemarketing.com/api/message => {"message": "Hello World!"}
*/
router.get('/message', (req, res, next) => {
	console.log(req);
	res.json({
		"message": "GET Request recieved!",
	});
});

router.post('/message', function(req, res, next) {
	console.log("body: ", req.body);
	res.json({
		"message": "Recieved",
	});
});

router.patch('/pull', function(req, res, next) {
	try {
		
		if (fs.existsSync(gitDir)) {
			fs.rmSync(gitDir, { recursive: true });
		}

		fs.mkdirSync(gitDir);

		const options = {
			baseDir: gitDir,
		};

		simpleGit(options).clean(simpleGit.CleanOptions.FORCE);

		const remote = config.gitRepository;

		simpleGit()
			.clone(remote)
			.then(() => {
				res.json({
					"status": 200,
					"message": "Successfully pulled BDOS from github",
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

router.get('/files/structure', (req, res, next) => {
	let diretoryTreeToObj = function(dir, done) {
		let results = [];

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
						diretoryTreeToObj(file, function(err, res) {
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

	diretoryTreeToObj(gitDir, function(err, response) {
		try {
			if(err) {
				console.error(err);

				res.json({
					"error": error,
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

				function sortArray(array) {
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
					"name": "BDOS",
					"type": "folder",
					"children": response,
					"status": 200,
				});
			}
		} catch (erorr) {
			res.json({
				"name": "BDOS",
				"type": "folder",
				"children": [],
				"status": 500,
			});
		}
	});


	
});



router.get

module.exports = router;
