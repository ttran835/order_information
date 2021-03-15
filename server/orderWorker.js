const throng = require('throng');
const Queue = require('bull');

// This file will be used to process all orders information

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const workers = process.env.WEB_CONCURRENCY || 2;

const maxJobsPerWorker = 15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function doWork(job, count) {
  try {
    let progress = 0;
    const sleepTimer = randomInteger(100, 10000);
    console.log({ progress });
    // pretend to process data
    while (progress < 100) {
      await sleep(sleepTimer);
      progress += 25;
      job.progress(progress);
    }
    return { value: 'Job is done' };
  } catch (err) {
    console.log('Error while trying to do work');
  }
}

function start() {
  // Connect to the named work queue
  const workQueue = new Queue('orders', REDIS_URL);

  workQueue.process(maxJobsPerWorker, async (job) => {
    if (job.data.type === 'csv') {
      return doWork(job, 1000);
    }
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
