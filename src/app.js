/* eslint-disable no-console */
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors');
const { config } = require('./config/config');

const appError = require('./middleware/appError');

const indexRouter = require('./routes');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');

const appUrl = config.APP_URL;
const port = config.PORT || 8000;

const app = express();

app.options('*', cors());
app.use(cors());
app.use(express.json());

app.use(
  // eslint-disable-next-line no-unused-vars
  morgan('combined', { skip: (req, res) => process.env.NODE_ENV === 'test' }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/', indexRouter);

app.use(appError);

sequelize.sync({ force: false }).then(() => {
  console.log('DB Connection has been established successfully.');
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    console.log(`Server is up on port ${appUrl}:${port}`);
    try {
      console.log(`${port} PORT Connection has been established successfully.`);
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  });
}

module.exports = app;
