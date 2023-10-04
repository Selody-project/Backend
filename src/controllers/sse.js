const {
  sseJoin, sseLeave, sendSSE, sendGroupSSE, getMissedNotifications,
} = require('../utils/sse');

// Model
const User = require('../models/user');

// Error
const {
  ApiError,
} = require('../errors');

async function sseController(req, res, next) {
  try {
    const { user } = req;
    const { userId } = user;

    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // SSE 연결 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 클라이언트 목록에 자신을 추가하고,
    // 자신이 가입된 모든 그룹 내 클라이언트 목록에 자신을 추가
    // getGroups 에 아직 가입 수락이 되지 않은 멤버는 잡히지 않도록 수정해야함.
    const groupIds = (await user.getGroups()).map((group) => group.groupId);
    sseJoin(groupIds, userId, res);

    // 현재 클라이언트에 SSE 연결 메시지를 전송
    sendSSE(`Connected user${userId}! 현재 서버 시간: ${new Date()}`, res);

    // 오프라인 중에 받지 못한 메시지를 재전송
    await getMissedNotifications(groupIds, user);

    // 클라이언트 연결 종료 시 자신을 클라이언트 목록에서 제거
    // 마지막을 받은 메시지의 id를 저장
    req.on('close', async () => {
      try {
        const lastNotificationId = res.lastNotificationId;
        if (lastNotificationId) {
          await user.update({ lastNotificationId });
        }
        sseLeave(groupIds, userId);
      } catch(err) { }
    });
  } catch (err) {
    console.log(err);
    return next(new ApiError());
  }
}

module.exports = sseController;
