// const throng = require('throng');
// const Queue = require('bull');

// // This file will be used to process all orders information

// const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// const workers = process.env.WEB_CONCURRENCY || 2;

// const maxJobsPerWorker = 15;

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function start() {
//   // Connect to the named work queue
//   const workQueue = new Queue('orders', REDIS_URL);

//   workQueue.process(maxJobsPerWorker, async (job) => {
//     // This is an example job that just slowly reports on progress
//     // while doing no work. Replace this with your own job logic.
//     // throw an error 5% of the time
//     console.log({ job });
//     console.log(job.data);
//     return { value: 'This is the input value' };
//   });
// }

// // Initialize the clustered worker process
// // See: https://devcenter.heroku.com/articles/node-concurrency for more info
// throng({ workers, start });
