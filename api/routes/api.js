var express = require('express');
var router = express.Router();
const simpleGit = require('simple-git');

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
	simpleGit().clean(simpleGit.CleanOptions.FORCE);

	const remote = `https://github.com/BjornTheProgrammer/BDOS.git`;

	simpleGit()
		.clone(remote)
		.then(() => console.log('finished'))
		.catch((err) => {
			console.error('failed: ', err)
			// simpleGit().pull('origin', 'master', {'--rebase': 'true'})
			// 	.then(() => console.log('finished'))
			// 	.catch((err) => console.error('failed: ', err))
		});

	res.json({
		"message": "Recieved",
	});
});

module.exports = router;
