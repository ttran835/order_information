'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const chalk = require('chalk');
const bodyParser = require('body-parser');
const { router } = require('./routes');
const Queue = require('bull');
const throng = require('throng');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const WORKERS = process.env.WEB_CONCURRENCY || 2;

// const db = require('./database');

function start() {
  const app = express();
  const workQueue = new Queue('work', REDIS_URL);
  const whitelist = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:8081',
    'https://centinela-feed.mybigcommerce.com',
    'http://localhost:1337',
  ];

  const corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
      corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
    } else {
      corsOptions = { origin: false }; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
  };

  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'https' || req.headers.host === 'localhost:3000') {
      return next();
    }
    res.redirect('https://' + req.hostname + req.url);
  });

  app.use(helmet());
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }),
  );

  app.use((req, res, next) => {
    // res.set('Cache-Control', 'public, max-age=10800, s-maxage=10800');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.get('*.js', (req, res, next) => {
    req.url = req.url + '.gz';
    res.set('Content-Encoding', 'gzip');
    res.set('Content-Type', 'text/javascript');
    next();
  });

  app.use(express.static(path.join(__dirname, '/../client/dist')));
  app.use(express.static(path.join(__dirname, '/../client/htmlTemplate')));

  app.use('/api/v1/big-commerce', cors(corsOptionsDelegate), router.bigCommerceRoutes);
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '/../client/dist/index.html'));
  });

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Port is ${port}`);
    whitelist.forEach((url) => console.log(chalk.yellow(`Whitelisted url: ${url}`)));
  });
}

throng({
  workers: WORKERS,
  lifetime: Infinity,
  start,
});
