const Queue = require('bull');
const shareConsts = require('./const');

const workQueue = new Queue('orders', shareConsts.REDIS_URL);

module.exports = () =>
  workQueue.on('global:completed', (jobId, result) => {
    console.log({ jobId });
    console.log({ result });
    console.log('pending result from orders: ' + result);
  });
