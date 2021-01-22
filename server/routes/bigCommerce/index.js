const { OrdersRoutes } = require('./ordersRoutes');
const bigCommerceRoutes = require('express').Router();

bigCommerceRoutes.use('/orders', OrdersRoutes);

module.exports = { bigCommerceRoutes };
