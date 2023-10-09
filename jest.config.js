module.exports = {
  // ... 기타 Jest 설정 ...
  transformIgnorePatterns: [
    '/node_modules/(?!node-cron)/', // node-cron 모듈은 트랜스파일하지 않음
  ],
};
