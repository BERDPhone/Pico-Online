var express = require('express');
var router = express.Router();

/* 
GET norsemarketing.com/api/message => {"message": "Hello World!"}
*/
router.get('/message', function(req, res, next) {
  res.json({
    "message": "Hello World!",
  });
});

module.exports = router;
