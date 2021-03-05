/* eslint-disable no-await-in-loop */
require('dotenv').config();
const chalk = require('chalk');
const Axios = require('axios');
const BluebirdPromise = require('bluebird');
const { parseAsync } = require('json2csv');

const { calculateMinMaxDate } = require('../helpers');
const { headers, details } = require('../jsonObjects');

const { CSV_TYPE } = require('../../shared/fetchConstants');

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
      // Put 30 minutes since details for annually takes forever cause of rate-limiting
      req.setTimeout(1800000);
      const { csvType, timePeriod, year } = req.params;

      // First calculate min and max dates to put for query params
      const { minDate, maxDate } = calculateMinMaxDate(timePeriod, year);

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
        async ({ id, date_created, date_shipped }) => {
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
                  ...currentDetails.map((detail) => ({ ...detail, date_created, date_shipped })),
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
      console.timeEnd('getAllDetails');

      // Sort by date
      const sortedAllDetails = allDetails.sort(
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
};

module.exports = { bigCommerceOrders };
