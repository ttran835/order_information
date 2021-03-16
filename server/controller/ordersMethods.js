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

const orderMethods = {
  /**
   * @param {Number} page
   * @param {Date} minDate
   * @param {Date} maxDate
   * @return {Object} formattedCSV for headers
   */
  createCsvHeader: async (minDate, maxDate) => {
    try {
      const allOrders = [];
      let page = 1;
      let notLastPage = true;
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

      const allOrdersJsonFormatted = allOrders.map((order) => headers(order));
      const csv = await parseAsync(allOrdersJsonFormatted);

      return csv;
    } catch (err) {
      console.log('error in createCSVHeader');
      throw err;
    }
  },
};

module.exports = { orderMethods };
