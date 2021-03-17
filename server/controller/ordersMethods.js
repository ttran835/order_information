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

      return allOrders;
    } catch (err) {
      console.log('error in createCSVHeader');
      throw err;
    }
  },

  /**
   * @param {Number} page
   * @param {Date} minDate
   * @param {Date} maxDate
   * @return {Object} formattedCSV for headers
   */
  createCsvDetails: async (minDate, maxDate) => {
    try {
      const allOrders = await orderMethods.createCsvHeader(minDate, maxDate);
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

      // Check for refunds in the details
      await BluebirdPromise.map(allDetails, async (detail) => {
        let refundRequestWentThrough = false;
        // Rate limit :(
        while (!refundRequestWentThrough) {
          try {
            // Get refund date from another request if refunded
            if (detail.is_refunded) {
              const refundArray = await getRefundDetails(detail.order_id);
              // In case of multiple refunds, find the correct one by
              // matching up the item id
              const itemIdToCreatedMapping = refundArray.reduce((acc, { created, items }) => {
                items.forEach(({ item_id }) => {
                  acc[item_id] = created;
                });
                return acc;
              }, {});
              const refundDate = itemIdToCreatedMapping[detail.id];
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
      const sortedAllDetails = allDetails.sort(
        (a, b) => new Date(b.date_created) - new Date(a.date_created),
      );

      // Format for details
      return sortedAllDetails;
    } catch (err) {
      console.log('Error in createCsvDetails');
      throw err;
    }
  },
};

module.exports = { orderMethods };
