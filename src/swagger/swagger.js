const swaggerAutogen = require('swagger-autogen')({ language: 'ko' });

const doc = {
  info: {
    title: 'Restful api 명세서',
    description: 'RestFul API 클라이언트 UI',
  },
  host: 'http://3.34.196.250',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  './src/app.js',
];

swaggerAutogen(outputFile, endpointsFiles, doc);
