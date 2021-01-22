require('dotenv').config();
const Sequelize = require('sequelize');
const chalk = require('chalk');

const { Op } = Sequelize;
const operatorsAliases = {
  $like: Op.like,
};
const devDb = new Sequelize(
  process.env.LOCAL_DB,
  process.env.LOCAL_USER,
  process.env.LOCAL_PASSWORD,

  {
    host: 'localhost',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false,
    },
    operatorsAliases: { operatorsAliases },
  },
);

// const productionDb = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   dialectOptions: {
//     ssl: true,
//   },
//   operatorsAliases: { operatorsAliases },
// });

// const sequelize = process.env.LOCAL_DB === undefined ? productionDb : devDb;

const sequelize = devDb;

sequelize
  .authenticate()
  .then(() => console.log(chalk.green('Conected to DB')))
  .catch((err) => console.error(chalk.red(err)));
sequelize
  .sync()
  // .sync({ alter: true })
  .then(() => console.log('App synced with all tables.'))
  .catch((err) => console.error(err));

module.exports = { sequelize };
