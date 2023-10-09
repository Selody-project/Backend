const cron = require('node-cron');
const moment = require('moment');
const { Sequelize } = require('sequelize');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');
// const Notification = require('../models/notification');

// 주기적인 작업 정의 (매일 자정에 실행)
cron.schedule('0 0 * * *', async () => {
  try {
    // 현재 시간을 UTC로 변환
    const currentUTC = moment().utc();

    // 6개월 전 시간을 계산 (UTC로 고정)
    const sixMonthsAgo = currentUTC.clone().subtract(6, 'months');

    await PersonalSchedule.destroy({
      where: {
        [Sequelize.Op.or]: [
          {
            recurrence: 0,
            startDateTime: {
              [Sequelize.Op.lt]: sixMonthsAgo.toDate(), // 6개월 이전
            },
          },
          {
            recurrence: 1,
            until: {
              [Sequelize.Op.lt]: sixMonthsAgo.toDate(), // 6개월 이전
            },
          },
        ],
      },
    });

    await GroupSchedule.destroy({
      where: {
        [Sequelize.Op.or]: [
          {
            recurrence: 0,
            startDateTime: {
              [Sequelize.Op.lt]: sixMonthsAgo.toDate(), // 6개월 이전
            },
          },
          {
            recurrence: 1,
            until: {
              [Sequelize.Op.lt]: sixMonthsAgo.toDate(), // 6개월 이전
            },
          },
        ],
      },
    });

    // 여기에 알림 데이터 정리 코드 추가. (추후 알림 기능 업데이트 이후 작성)

    console.log('데이터 정리 작업이 완료되었습니다.');
  } catch (err) {
    console.error('데이터 정리 작업 중 오류가 발생했습니다.', err);
  }
});

module.exports = cron;
