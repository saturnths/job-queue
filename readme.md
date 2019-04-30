# Job queue

# Setup
Start redis first: `redis-server`

Then start the app: `node app.js`

The app is available at [http://localhost:3000](http:/localhost:3000).

# Adding a job:

  $ curl -X POST -H "Content-Type: application/json" -d '{"url": "https://www.google.com"}' http://localhost:3000/jobs/add

Output: `Added job #1`

# Getting a job's status:

  $ curl -X GET -H "Content-Type: application/json" http://localhost:3000/jobs/status/1

Output: `{"_progress: "100", "_state": "active", "html": ""}`


TODO:
* Implement rate limiting by using tokenbucket - up to 100 jobs, use backpressure and return 503 in the meanwhile.
* Set a limit for content length of resources, e.g. 100mb. Enforce by checking headers and actual request contents, abort if the limit is exceeded.
