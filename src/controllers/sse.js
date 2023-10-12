const {
  sseJoin, sseLeave, sendSSE, loadNotifications,
} = require('../utils/sse');

// Model
const Notification = require('../models/notifications');

// Error
const {
  DataFormatError, ApiError, NotFoundError,
} = require('../errors');

// Validator
const {
  validateNotificationIdSchema,
} = require('../utils/validators');

async function getNotifications(req, res, next) {
  try {
    const { error: paramError } = validateNotificationIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { notification_id: notificationId } = req.params;
    const { user } = req;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: user.userId,
      },
    });
    if (!notification) {
      return next(new NotFoundError());
    }

    const response = { ...notification.dataValues };
    await notification.destroy();

    return res.status(200).json(response);
  } catch (err) {
    return next(new ApiError());
  }
}

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
    sendSSE(`Connected ${user.nickname}! 현재 서버 시간: ${new Date()}`, res);

    // 오프라인 중에 받지 못한 메시지를 재전송
    await loadNotifications(user);

    // 클라이언트 연결 종료 시 자신을 클라이언트 목록에서 제거
    // 마지막을 받은 메시지의 id를 저장
    req.on('close', async () => {
      sseLeave(groupIds, userId);
    });
  } catch (err) {
    console.log(err);
    return next(new ApiError());
  }
}

module.exports = {
  getNotifications,
  sseController,
};
