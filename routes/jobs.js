const express = require('express');
const router = express.Router();
const jobs = require('../jobs');

// Takes a url, adds a new job.
router.post('/add', function(req, res, next) {
  const url = req.body.url;
  jobs.add(url, res);
});

// Checks status of a job.
router.get('/status/:id', function(req, res, next) {
  const id = req.params.id;
  jobs.check(id, res);
});

module.exports = router;
