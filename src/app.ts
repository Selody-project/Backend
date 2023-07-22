/* eslint-disable no-console */
import express = require('express');
import rateLimit from 'express-rate-limit';
import morgan = require('morgan');

import * as dotenv from 'dotenv';

import cookieParser = require('cookie-parser');

import cors = require('cors');
import swaggerUi = require('swagger-ui-express');
import { config } from './config/config';

import apiError from './middleware/apiError';

import indexRouter from './routes';
import { sequelize } from './models';

dotenv.config({ path: `${__dirname}\\..\\.env` });

process.env.TZ = 'Etc/Universal';
const appUrl = config.APP_URL;
const port = config.PORT || 8000;

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

export default app;
