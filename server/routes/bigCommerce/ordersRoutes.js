const OrdersRoutes = require('express').Router();
const { bigCommerceOrders } = require('../../controller/bigCommerceOrders');

OrdersRoutes.route('/get-all-orders').get(bigCommerceOrders.getOrders);
OrdersRoutes.route('/:orderId/get-product-list').get(bigCommerceOrders.getOrderProducts);

module.exports = { OrdersRoutes };
