require('dotenv').config();
const chalk = require('chalk');
const Axios = require('axios');
const { parseAsync } = require('json2csv');

const { headers, details } = require('../jsonObjects');

const { TIME_PERIOD, CSV_TYPE } = require('../../shared/fetchConstants');

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
    console.log('Error in getAllOrdersFunc');
    throw error;
  }
};

const getOrderProductsFunc = async (orderId) => {
  try {
    const { data } = await Axios.get(`${bcUrlV2}/orders/${orderId}/products`, optionsHeader);
    return data;
  } catch (error) {
    console.log('Error in getOrderProductsFunc');
    throw error;
  }
};

const getOrdersCountFunc = async () => {
  try {
    const { data } = await Axios.get(`${bcUrlV2}/orders/count`, optionsHeader);
    return data.count;
  } catch (error) {
    console.log('Error in getOrdersCountFunc');
    throw error;
  }
};

const getLastDayOfMonth = (y, m) => new Date(y, m + 1, 0).getDate();

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
      console.log(data.length);
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
      console.log(chalk.redBg(JSON.stringify(error)));
    }
  },

  /**
   * Receive list of products from a specific order and sends back details csv
   */
  getOrderProducts: async (req, res) => {
    try {
      const { orderId } = req.params;
      const data = await getOrderProductsFunc(orderId);
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
      console.log(chalk.redBg(JSON.stringify(error)));
    }
  },

  /**
   * Receives order count
   */
  getOrderCount: async (req, res) => {
    try {
      const data = await getOrdersCountFunc();
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
      console.log(chalk.redBg(JSON.stringify(error)));
    }
  },

  /**
   * Sends back oldest year
   */
  getYearRange: async (req, res) => {
    try {
      // Get total order count to get the oldest record so we know what years
      // are valid
      const count = await getOrdersCountFunc();
      const lastPage = Math.ceil(count / 250);
      const lastOrder = (await getAllOrdersFunc(lastPage)).pop();
      const oldestYear = new Date(lastOrder.date_created).getFullYear();

      res.status(200).send(oldestYear);
    } catch (error) {
      res.sendStatus(400);
      console.log(chalk.redBg(JSON.stringify(error)));
    }
  },

  /**
   * Sends back csv for either header or detail for specific time periods
   */
  getCsvs: async (req, res) => {
    try {
      const { csvType, timePeriod, year } = req.params;

      const quarterlyMapping = {
        [TIME_PERIOD.JAN_TO_MARCH]: { start: 0, end: 2 },
        [TIME_PERIOD.APRIL_TO_JUNE]: { start: 3, end: 5 },
        [TIME_PERIOD.JULY_TO_SEPTEMBER]: { start: 6, end: 8 },
        [TIME_PERIOD.OCTOBER_TO_DECEMBER]: { start: 9, end: 11 },
      };

      const monthMapping = {
        [TIME_PERIOD.JANUARY]: 0,
        [TIME_PERIOD.FEBRUARY]: 1,
        [TIME_PERIOD.MARCH]: 2,
        [TIME_PERIOD.APRIL]: 3,
        [TIME_PERIOD.MAY]: 4,
        [TIME_PERIOD.JUNE]: 5,
        [TIME_PERIOD.JULY]: 6,
        [TIME_PERIOD.AUGUST]: 7,
        [TIME_PERIOD.SEPTEMBER]: 8,
        [TIME_PERIOD.OCTOBER]: 9,
        [TIME_PERIOD.NOVEMBER]: 10,
        [TIME_PERIOD.DECEMBER]: 11,
      };

      // First calculate min and max dates to put for query params
      let minDate;
      let maxDate;
      // Quarterly
      if (Object.keys(quarterlyMapping).includes(timePeriod)) {
        const { start, end } = quarterlyMapping[timePeriod];
        minDate = new Date(year, start).toISOString();
        maxDate = new Date(year, end, getLastDayOfMonth(year, end), 23, 59, 59).toISOString();

        // Annually
      } else if (timePeriod === TIME_PERIOD.ANNUAL) {
        minDate = new Date(year, 0).toISOString();
        maxDate = new Date(year, 11, getLastDayOfMonth(year, 11), 23, 59, 59).toISOString();

        // Monthly
      } else {
        const month = monthMapping[timePeriod];
        minDate = new Date(year, month).toISOString();
        maxDate = new Date(year, month, getLastDayOfMonth(year, month), 23, 59, 59);
      }

      // Get all orders for timePeriod and year since both headers and details
      // rely on it
      
    } catch (error) {}
  },
};

module.exports = { bigCommerceOrders };
