require('dotenv').config();
const chalk = require('chalk');
const Axios = require('axios');

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

/**
 * Requests to BigCommerce API can only be made via server
 * You cannot make requests on client side. 
 * Adjust controllers based on what you need.
 */

const bigCommerceOrders = {
  /**
   * Receive all orders from BigCommerce
   */
  getOrders: async (req, res) => {
    try {
      const data = await Axios.get(`${bcUrlV2}/orders`, optionsHeader);
      if (data.length < 1) return res.sendStatus(400);
      res.status(200).send(data);
    } catch (err) {
      console.log(chalk.redBg(JSON.stringify(err)));
    }
  },

  /**
   * Receive list of products from a specific order
   */
  getOrderProducts: async (req, res) => {
    try {
      const { orderId } = req.query;
      const data = await Axios.get(`${bcUrlV2}/orders/${orderId}/products`, optionsHeader);
      if (data.length < 1) return res.sendStatus(400);
      res.status(200).send(data);
    } catch (err) {
      console.log(chalk.redBg(JSON.stringify(err)));
    }
  },
};

module.exports = { bigCommerceOrders };
