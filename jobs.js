const kue = require('kue');
const queue = kue.createQueue();

const redis = require('redis');
const client = redis.createClient();

const rp = require('request-promise');
const urlExists = require('url-exists');

const CONCURRENT_JOBS = 5;

queue.watchStuckJobs();

// Listeners:
queue.on('error', function(err) {
  console.log('Kue error: ', err);
});

client.on('connect', function() {
  console.log('Redis connection success');
});

client.on('error', function(err) {
  console.log('Redis error: ', err);
});

const addJob = (url, res) => {
  const job = queue.create('job', { url }).save(err => {
    if (!err) {
      client.hset(job.id, 'html', '', redis.print);
      res.json({ id: job.id, status: 'Job successfully added' });
      return;
    }
    res.sendStatus(500);
  });
};

// Adds a url as a new job. Checks if the url is valid and exists.
const add = (url, res) => {
  addJob(url, res);
};

// Checks status of a specific job.
const check = (id, res) => {
  kue.Job.get(id, (err, job) => {
    if (err) {
      res.send('Error retrieving job with id ' + id);
      return;
    }

    // Query the db for html and return it as part of the check response.
    client.hget(job.id, 'html', function(err, html) {
      res.json({
        state: job._state,
        html,
      });
    });
  });
};

const failJob = (job, msg, done) => {
  const err = new Error(msg);
  job.failed().error(err);
  console.log(msg);
  done(err);
};

// Downloads contents for a url, then stores results to redis.
const processJob = (url, job, done) => {
  const options = {
    uri: url,
    resolveWithFullResponse: true,
  };

  rp(options)
    .then(function(response) {
      // TODO: set limit for content length
      client.hset(job.id, 'html', response.body, redis.print);
      done();
    })
    .catch(function(err) {
      const msg = `Could not fetch url for job with id ${job.id} due to ${err}`;
      failJob(job, msg, done);
    });
};

// Starts processing jobs and downloading their contents,
// CONCURRENT_JOBS at a time.
queue.process('job', CONCURRENT_JOBS, (job, done) => {
  const url = job.data.url;

  // Not all urls have protocol included.
  const fullUrl = !/^https?:\/\//i.test(url) ? 'http://' + url : url;

  urlExists(fullUrl, function(err, exists) {
    if (!exists) {
      // No resource exists for this url, fail the job.
      const msg = 'The resource with this url does not exist.';
      failJob(job, msg, done);
    } else {
      processJob(fullUrl, job, done);
    }
  });
});

module.exports = {
  add,
  check,
};
