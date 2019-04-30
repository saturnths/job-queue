const kue = require('kue');
const queue = kue.createQueue();

// queue.client.flushdb(function(err) {
//   if (!err) console.log('Db flushed');
// });

// TODO: use kue-mock
