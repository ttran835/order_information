const webpack = require('webpack'),
  merge = require('webpack-merge'),
  commonConfig = require('./webpack.config.js');

module.exports = merge(commonConfig(false), {
  devtool: 'source-map',
  mode: 'production',
  optimization: {
    noEmitOnErrors: true,
  },
});
