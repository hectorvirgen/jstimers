var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/timers', function(req, res, next) {
  res.render('timers');
});

module.exports = router;
