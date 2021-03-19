const Queue = require('bull');
const { shared } = require('../shared');

const workQueue = new Queue('orders', shared.consts.urls.REDIS_URL);

module.exports = () =>
  workQueue.on('global:completed', (jobId, result) => {
    console.log('job completed with Id: ' + jobId);
    // console.log('pending result from orders: ' + result);
  });
