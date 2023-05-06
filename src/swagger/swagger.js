const swaggerAutogen = require('swagger-autogen')({ language: 'ko' });

const doc = {
  info: {
    title: 'Restful api 명세서',
    description: 'RestFul API 클라이언트 UI',
  },
  host: 'http://127.0.0.1:8000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  './src/app.js',
];

swaggerAutogen(outputFile, endpointsFiles, doc);
