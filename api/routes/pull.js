var express = require('express');
var router = express.Router();

/* 
GET norsemarketing.com/api/message => {"message": "Hello World!"}
*/
router.post('/', function(req, res, next) {
	console.log("body: ", req.body);
	res.json({
		"message": "Recieved",
	});
});

module.exports = router;
