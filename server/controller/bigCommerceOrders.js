/* eslint-disable no-await-in-loop */
require('dotenv').config();
const chalk = require('chalk');
const Axios = require('axios');
const { cloneDeep } = require('lodash');
const BluebirdPromise = require('bluebird');
const { parseAsync } = require('json2csv');
const Queue = require('bull');

const { calculateMinMaxDate } = require('../helpers');
const { shared } = require('../../shared');
const { headers, details } = require('../jsonObjects');
const { CSV_TYPE } = require('../../shared/fetchConstants');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const workQueue = new Queue('orders', REDIS_URL);

const bcUrlV2 = process.env.BC_API_PATH_V2;
const bcUrlV3 = process.env.BC_API_PATH_V3;

const optionsHeader = {
  async: true,
  crossDomain: true,
  headers: {
    'X-Auth-Client': process.env.BC_CLIENT_ID,
    'X-Auth-Token': process.env.BC_ACCESS_TOKEN,
  },
};

// Dates need to be RFC-2822 or ISO-8601
const getAllOrdersFunc = async (page, minDate, maxDate) => {
  try {
    const queryParams = [
      'sort=date_created:desc',
      `page=${page}`,
      'limit=250',
      ...(minDate ? [`min_date_created=${minDate}`] : []),
      ...(maxDate ? [`max_date_created=${maxDate}`] : []),
    ].join('&');

    const { data } = await Axios.get(`${bcUrlV2}/orders?${queryParams}`, optionsHeader);

    return data;
  } catch (error) {
    console.log('Error in getAllOrdersFunc: ', error);
    throw error;
  }
};

const getOrderProductsFunc = async (orderId, page = 1) => {
  try {
    const queryParams = [`page=${page}`, 'limit=250'].join('&');
    const { data } = await Axios.get(
      `${bcUrlV2}/orders/${orderId}/products?${queryParams}`,
      optionsHeader,
    );
    return data;
  } catch (error) {
    // console.log('Error in getOrderProductsFunc: ', error);
    throw error;
  }
};

const getOrdersCountFunc = async () => {
  try {
    const { data } = await Axios.get(`${bcUrlV2}/orders/count`, optionsHeader);
    return data.count;
  } catch (error) {
    console.log('Error in getOrdersCountFunc: ', error);
    throw error;
  }
};

const getRefundDetails = async (orderId) => {
  try {
    const {
      data: { data },
    } = await Axios.get(`${bcUrlV3}/orders/${orderId}/payment_actions/refunds`, optionsHeader);
    return data;
  } catch (error) {
    // console.log('Error in getRefundDetails: ', error);
    throw error;
  }
};

/**
 * Requests to BigCommerce API can only be made via server
 * You cannot make requests on client side.
 * Adjust controllers based on what you need.
 */

const bigCommerceOrders = {
  /**
   * Receive all orders from BigCommerce and sends back headers csv
   */
  getOrders: async (req, res) => {
    try {
      const { page } = req.query;
      const data = await getAllOrdersFunc(page || 1);
      if (!data) res.sendStatus(400);
      console.log(data.length);
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
      console.log(error);
    }
  },

  /**
   * Receive list of products from a specific order and sends back details csv
   */
  getOrderProducts: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { page } = req.query;
      const data = await getOrderProductsFunc(orderId, page || 1);
      if (!data) res.sendStatus(400);
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
      console.log(error);
    }
  },

  /**
   * Receives order count
   */
  getOrderCount: async (req, res) => {
    try {
      const data = await getOrdersCountFunc();
      res.status(200).send({ count: data });
    } catch (error) {
      res.sendStatus(400);
      console.log(error);
    }
  },

  /**
   * Sends back oldest year
   */
  getOldestYear: async (req, res) => {
    try {
      // Get total order count to get the oldest record so we know what years
      // are valid
      const count = await getOrdersCountFunc();
      const lastPage = Math.ceil(count / 250);
      const lastOrder = (await getAllOrdersFunc(lastPage)).pop();
      const oldestYear = new Date(lastOrder.date_created).getFullYear();

      res.status(200).send({ oldestYear });
    } catch (error) {
      res.sendStatus(400);
      console.log(error);
    }
  },

  /**
   * Sends back csv for either header or detail for specific time periods
   */
  getCsvs: async (req, res) => {
    try {
      // Date param is specifically for daily option and comes from a diff endpoint
      const { csvType, timePeriod, year, date } = req.params;

      const { minDate, maxDate } = calculateMinMaxDate(timePeriod, year, date);

      // Get all orders for timePeriod and year since both headers and details
      // rely on it
      const allOrders = [];
      let notLastPage = true;
      let page = 1;
      console.time('getAllOrders');
      while (notLastPage) {
        const results = await getAllOrdersFunc(page, minDate, maxDate);
        if (results) {
          allOrders.push(...results.filter(({ status }) => status !== 'Incomplete'));
          // Only go on to next page if there are at least 250 results which
          // is the limit
          if (results.length < 250) {
            notLastPage = false;
          } else {
            page += 1;
          }
        } else {
          notLastPage = false;
        }
      }
      console.timeEnd('getAllOrders');

      if (csvType === CSV_TYPE.HEADERS) {
        // Format if headers csv requested
        const allOrdersJsonFormatted = allOrders.map((order) => headers(order));
        const csv = await parseAsync(allOrdersJsonFormatted);

        // Send back csv
        res.attachment('headers.csv');
        return res.status(200).send(csv);
      }
      // Get all details for all the invoices gotten from above
      const allDetails = [];
      console.time('getAllDetails');
      await BluebirdPromise.map(
        allOrders,
        async ({ id, date_created, date_shipped, date_modified, shipping_cost_inc_tax }) => {
          let requestWentThrough = false;
          let detailsNotLastPage = true;
          let detailsPage = 1;
          // Big Commerce API Rate limit lulz
          while (!requestWentThrough || detailsNotLastPage) {
            try {
              // Have to set this here in case there are multiple page requests
              // for a single order
              requestWentThrough = false;
              const currentDetails = await getOrderProductsFunc(id, detailsPage);
              if (currentDetails) {
                allDetails.push(
                  ...currentDetails.map((detail) => ({
                    ...detail,
                    date_created,
                    date_shipped: date_shipped || date_modified,
                  })),
                );
                // Only go on to next page if there are at least 250 results which
                // is the limit
                if (currentDetails.length < 250) {
                  detailsNotLastPage = false;
                } else {
                  detailsPage += 1;
                }
              } else {
                detailsNotLastPage = false;
              }
              requestWentThrough = true;
              if (allDetails.length % 5 === 0) console.log(allDetails.length);
            } catch (error) {
              console.log('rate-limited reached');
              setTimeout(() => {}, 5000);
            }
          }
        },
        { concurrency: 7 },
      );

      // Check for refunds in the details
      const originalCreatedDateForRefundedDetails = [];
      await BluebirdPromise.map(allDetails, async (detail) => {
        console.log({ detail });
        let refundRequestWentThrough = false;
        // Rate limit :(
        while (!refundRequestWentThrough) {
          try {
            // Get refund date from another request if refunded
            if (detail.is_refunded) {
              const refundArray = await getRefundDetails(detail.order_id);
              // In case of multiple refunds, find the correct one by
              // matching up the item id
              const itemIdToCreatedMapping = refundArray.reduce(
                (acc, { created, items, total_amount }) => {
                  items.forEach(({ item_id }) => {
                    acc[item_id] = { created, total_amount };
                  });
                  return acc;
                },
                {},
              );
              const refundDate = itemIdToCreatedMapping[detail.id].created;
              const totalRefunded = itemIdToCreatedMapping[detail.id].total_amount;
              const originalDetail = cloneDeep(detail);
              // Janky way of telling apart original and refunded but oh well
              originalDetail.original = true;
              originalCreatedDateForRefundedDetails.push(originalDetail);
              detail.total_inc_tax = totalRefunded;
              detail.date_created = refundDate;
              detail.date_shipped = refundDate;
            }
            refundRequestWentThrough = true;
          } catch (error) {
            console.log('refund order rate-limited reached');
            setTimeout(() => {}, 5000);
          }
        }
      });
      console.timeEnd('getAllDetails');

      // Sort by date
      const sortedAllDetails = [...allDetails, ...originalCreatedDateForRefundedDetails].sort(
        (a, b) => new Date(b.date_created) - new Date(a.date_created),
      );

      // Format for details
      const allDetailsJsonFormatted = sortedAllDetails.map((detail) => details(detail));
      const csv = await parseAsync(allDetailsJsonFormatted);

      // Send back csv
      res.attachment('details.csv');
      return res.status(200).send(csv);
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  },

  postJob: async (req, res) => {
    try {
      console.log(req.params);

      const { csvType, timePeriod, year, date } = req.params;
      const { minDate, maxDate } = calculateMinMaxDate(timePeriod, year, date);

      if (csvType === CSV_TYPE.HEADERS) {
        const job = await workQueue.add({
          type: shared.consts.workerTypes.orders.HEADERS,
          minDate,
          maxDate,
        });
        res.status(200).send({ id: job.id });
      }

      if (csvType === CSV_TYPE.DETAILS) {
        const job = await await workQueue.add({
          type: shared.consts.workerTypes.orders.DETAILS,
          minDate,
          maxDate,
        });
        res.status(200).send({ id: job.id });
      }
    } catch (err) {
      console.log('Error in post Job');
      console.error(err);
      res.status(400).send(err);
    }
  },

  getJobStatus: async (req, res) => {
    try {
      const id = req.params.id;
      // const completedeJobs = await workQueue.getCompleted();
      const job = await workQueue.getJob(id);
      console.log(await job.getState());
      // console.log(job.returnvalue);
      // completedeJobs.sort((a, b) => a.finishedOn - b.finishedOn);
      // completedeJobs.map(({ id, _progress }) => {
      //   return { id, progress: _progress };
      // });
      // const count = await workQueue.getActiveCount();
      const csv = job.returnvalue;

      // Send back csv
      res.attachment('details.csv');
      return res.status(200).send(csv);
      // return res.status(200).send(completedeJobs);
    } catch (err) {
      console.log(err);
      res.sendStatus(400);
    }
  },
};

module.exports = { bigCommerceOrders };
