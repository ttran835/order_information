require('dotenv').config();
const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const LodashPlugin = require('lodash-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const SRC_DIR = path.join(__dirname, '/client/src');
const DIST_DIR = path.join(__dirname, '/client/dist');

// Common configuration, with extensions in webpack.dev.js and webpack.prod.js.
module.exports = (isDevelopment) => {
  const currentPath = path.join(__dirname);
  const localDevEnv = currentPath + '/.env';

  const productionEnv = {};

  let localEnvConfigs = dotenv.config({ path: localDevEnv }).parsed;
  localEnvConfigs = { ...localEnvConfigs, bigCommerceUrl: 'http://localhost:3000/api/v1/big-commerce' };

  const fileEnv = !isDevelopment ? productionEnv : localEnvConfigs;

  const envKeys = Object.keys(fileEnv).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(fileEnv[next]);
    return prev;
  }, {});

  return {
    entry: [
      '@babel/polyfill',
      // 'webpack-hot-middleware/client?reload=true',
      `${SRC_DIR}/index.jsx`,
    ],
    output: {
      path: path.resolve(__dirname, DIST_DIR),
      filename: '[name].chunk.js',
      publicPath: '/',
    },
    devServer: {
      contentBase: path.join(__dirname, DIST_DIR),
      historyApiFallback: true,
      overlay: true,
      port: 8000,
      host: 'localhost',
    },
    watchOptions: {
      poll: 1000,
      ignored: ['node_modules'],
    },
    stats: { warnings: false },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: /(assets\/js|assets\\js|stencil-utils)/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                'lodash', // Tree-shake lodash
              ],
            },
          },
        },
        {
          test: /\.jsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    loose: true, // Enable "loose" transformations for any plugins in this preset that allow them
                    modules: false, // Don't transform modules; needed for tree-shaking
                    useBuiltIns: 'usage', // Tree-shake babel-polyfill
                    targets: '> 1%, last 2 versions, Firefox ESR',
                    corejs: '^3.4.1',
                  },
                  '@babel/preset-react',
                ],
              ],
            },
          },
        },
        {
          test: /\.module\.s(a|c)ss$/,
          loader: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment,
                modules: {
                  localIdentName: '[name]-[local]-[hash:base64]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                config: {
                  path: 'postcss.config.js',
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
        {
          test: /\.s(a|c)ss$/,
          exclude: /\.module.(s(a|c)ss)$/,
          loader: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          exclude: [/vendors/, /img/],
          loader: 'file-loader?name=fonts/[name].[ext]',
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          exclude: [/node_modules/, /img/],
          loader: 'file-loader?name=font/roboto/[name].[ext]',
        },
        {
          test: /.(png|jpg|gif|svg)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            useRelativePath: true,
          },
        },
      ],
    },
    performance: {
      hints: 'warning',
      maxAssetSize: 1024 * 300,
      maxEntrypointSize: 1024 * 300,
    },
    plugins: [
      new webpack.DefinePlugin(envKeys),
      new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$|\.eot?.+$|\.ttf?.+$|\.woff?.+$|\.svg?.+$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      new webpack.ProvidePlugin({
        Promise: 'es6-promise-promise',
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
      }),
      new CleanWebpackPlugin({
        verbose: false,
        watch: false,
      }),
      new MiniCssExtractPlugin(),
      new LodashPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      // Use NoErrorsPlugin for webpack 1.x
      new webpack.NoEmitOnErrorsPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.join(__dirname, 'client/htmlTemplate/template.html'),
      }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 6,
            compress: true,
            cache: false,
            output: {
              comments: false,
              beautify: false,
            },
          },
        }),
      ],
      concatenateModules: true,
    },
    resolve: {
      alias: {
        Utils: path.resolve(__dirname, 'client/src/utils'),
        Comps: path.resolve(__dirname, 'client/src/Components'),
      },
      extensions: ['.jsx', '.js'],
    },
  };
};
