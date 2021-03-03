const OrdersRoutes = require('express').Router();
const { bigCommerceOrders } = require('../../controller/bigCommerceOrders');

OrdersRoutes.route('/get-all-orders').get(bigCommerceOrders.getOrders);
OrdersRoutes.route('/:orderId/get-product-list').get(bigCommerceOrders.getOrderProducts);
OrdersRoutes.route('/count').get(bigCommerceOrders.getOrderCount);
OrdersRoutes.route('/csv/:csvType/time-period/:timePeriod/year/:year').get(bigCommerceOrders.getOrderCount);

module.exports = { OrdersRoutes };


// TIME SPENT SO FAR: 3 HOURS