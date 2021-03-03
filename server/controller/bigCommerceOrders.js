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

      const quarterly = [
        TIME_PERIOD.JAN_TO_MARCH,
        TIME_PERIOD.APRIL_TO_JUNE,
        TIME_PERIOD.JULY_TO_SEPTEMBER,
        TIME_PERIOD.OCTOBER_TO_DECEMBER,
      ];

      // First get all orders for timePeriod and year since both headers and details
      // rely on it
      let minDate;
      let maxDate;
      if (quarterly.includes(timePeriod)) {
        
      }
    } catch (error) {}
  },
};

module.exports = { bigCommerceOrders };
