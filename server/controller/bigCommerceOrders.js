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

const getAllOrdersFunc = async (page) => {
  try {
    const queryParams = ['sort=date_created:desc', `page=${page}`, 'limit=250'].join('&');

    const { data } = await Axios.get(`${bcUrlV2}/orders?${queryParams}`, optionsHeader);

    return data;
  } catch (error) {
    console.log('Error in getAllOrdersFunc');
    throw error;
  }
};

const getOrderProductsFunc = async (orderId) => {
  try {
    const { data } = await Axios.get(
      `${bcUrlV2}/orders/${orderId}/products`,
      optionsHeader,
    );
    return data;
  } catch (error) {
    console.log('Error in getOrderProductsFunc');
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
      if (data.length < 1) return res.sendStatus(400);
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
      if (data.length < 1) return res.sendStatus(400);
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
      const { data } = await Axios.get(`${bcUrlV2}/orders/count`, optionsHeader);
      if (data.length < 1) return res.sendStatus(400);
      res.status(200).send(data);
    } catch (error) {
      res.sendStatus(400);
    }
  },

  getCsvs: async (req, res) => {
    try {
      const { csvType, timePeriod, year } = req.params;

      // First get all orders for frequency and year since both headers and details
      // rely on it

    } catch(error) {

    }
  }
};

module.exports = { bigCommerceOrders };
