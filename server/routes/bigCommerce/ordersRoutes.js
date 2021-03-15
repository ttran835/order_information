const OrdersRoutes = require('express').Router();
const { bigCommerceOrders } = require('../../controller/bigCommerceOrders');

OrdersRoutes.route('/get-all-orders').get(bigCommerceOrders.getOrders);
OrdersRoutes.route('/:orderId/get-product-list').get(bigCommerceOrders.getOrderProducts);
OrdersRoutes.route('/count').get(bigCommerceOrders.getOrderCount);
OrdersRoutes.route('/oldestYear').get(bigCommerceOrders.getOldestYear);
OrdersRoutes.route('/csv/:csvType/time-period/:timePeriod/year/:year').get(bigCommerceOrders.getCsvs);
OrdersRoutes.route('/csv/:csvType/date/:date').get(bigCommerceOrders.getCsvs);

OrdersRoutes.route('/post-job').post(bigCommerceOrders.postJob);
OrdersRoutes.route('/get-jobs').get(bigCommerceOrders.getJobStatus);

module.exports = { OrdersRoutes };


// TIME SPENT SO FAR: 15 HOURS