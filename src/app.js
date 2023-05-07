/* eslint-disable no-console */
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./config/config');

const apiError = require('./middleware/apiError');

const indexRouter = require('./routes');
const { sequelize } = require('./models');

const appUrl = config.APP_URL;
const port = config.PORT || 8000;

process.env.TZ = 'Asia/Seoul';

const app = express();

app.use('/api/', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
}));

app.options('*', cors());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(
  // eslint-disable-next-line no-unused-vars
  morgan('dev', { skip: (req, res) => process.env.NODE_ENV === 'test' }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger setting
const swaggerFile = require('./swagger/swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// router
app.use('/api', indexRouter);

app.use(apiError);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    console.log(`Server is up on port ${appUrl}:${port}`);
    try {
      await sequelize.sync({ force: false }).then(() => {
        console.log('DB Connection has been established successfully.');
      }).catch((error) => {
        console.error('Unable to connect to the database: ', error);
      });
      console.log(`${port} PORT Connection has been established successfully.`);
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  });
}

module.exports = app;
