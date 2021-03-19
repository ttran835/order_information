require('dotenv').config();
const throng = require('throng');
const Queue = require('bull');
const Axios = require('axios');
const { parseAsync } = require('json2csv');
const { headers, details } = require('./jsonObjects');

const { shared } = require('../shared');
const { orderMethods } = require('./controller/ordersMethods');

// This file will be used to process all orders information

const workers = process.env.WEB_CONCURRENCY || 2;

const maxJobsPerWorker = 15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function doWork(job, count) {
  console.log(job.data);
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
  const workQueue = new Queue('orders', shared.consts.urls.REDIS_URL);
  workQueue.process(maxJobsPerWorker, async (job) => {
    try {
      const { minDate, maxDate, type } = job.data || {};

      if (type === 'csv') {
        return doWork(job, 1000);
      }

      if (job.data.type === shared.consts.workerTypes.orders.HEADERS) {
        const allOrders = await orderMethods.createCsvHeader(minDate, maxDate);
        const allOrdersJsonFormatted = allOrders.map((order) => headers(order));
        const csv = await parseAsync(allOrdersJsonFormatted);
        return csv;
      }

      if (job.data.type === shared.consts.workerTypes.orders.DETAILS) {
        const allDetails = await orderMethods.createCsvDetails(minDate, maxDate); 
        const allDetailsJsonFormatted = allDetails.map((detail) => details(detail));
        const csv = await parseAsync(allDetailsJsonFormatted);
        return csv;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
