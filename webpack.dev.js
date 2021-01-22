const webpack = require('webpack'),
  merge = require('webpack-merge'),
  commonConfig = require('./webpack.config.js');

module.exports = merge(commonConfig(true), {
  devtool: 'inline-source-map',
  mode: 'development',
  performance: {
    hints: false,
  },
});
