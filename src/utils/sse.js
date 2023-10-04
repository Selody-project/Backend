const { Sequelize } = require('sequelize');
const { Op } = Sequelize;

// Model
const Notification = require('../models/notifications');

const clients = {};

async function sseJoin(groupIds, userId, res) {
  clients[`user/${userId}`] = [{ id: userId, res }];
  groupIds.forEach(async (groupId) => {
    if (!clients[`group/${groupId}`]) {
      clients[`group/${groupId}`] = [];
    }
    clients[`group/${groupId}`].push({ id: userId });
  });
  res.lastSendId = {};
  console.log(clients);
}

async function sseLeave(groupIds, userId) {
  delete clients[`user/${userId}`];
  groupIds.forEach(async (groupId) => {
    const groupClients = clients[`group/${groupId}`];
    if (groupClients) {
      const index = groupClients.findIndex((user) => user.id === userId);
      if (index !== -1) {
        groupClients.splice(index, 1);
      }
    }
  });
  console.log(clients);
}

async function sseGroupJoin(groupId, user) {
  const userId = user.userId;
  if (!clients[`group/${groupId}`]) {
    clients[`group/${groupId}`] = [];
  }
  clients[`group/${groupId}`].push({ id: userId });
  sendGroupSSE(`${user.nickname}님이 그룹에 참여하였습니다.`, user, groupId);
  console.log(clients);
}

async function sseGroupLeave(groupId, user) {
  const userId = user.userId;
  const groupClients = clients[`group/${groupId}`];
  const index = groupClients.findIndex((user) => user.id === userId);
  if (index !== -1) {
    groupClients.splice(index, 1);
  }
  console.log(clients);
}

async function sseGroupRemove(groupId) {
  delete clients[`group/${groupId}`];
  console.log(clients);
}

async function sendSSE(data, res) {
  res.write(`data: ${data}\n\n`);
}

async function sendGroupSSE(data, user, groupId) {
  try {
    const userId = user.userId;
    // db 작업 오류시에는 어떻게 대응하지?
    const notification = await Notification.create({ 
      content: data,
      notificationType: 'group',
      receiverId: groupId,
    });

    const groupClients = clients[`group/${groupId}`];
    if (groupClients) {
      groupClients.forEach(async (user) => {
        if (clients[`user/${userId}`]) {
          const { res } = clients[`user/${user.id}`][0];
          res.lastNotificationId = notification.id;
          if (userId !== user.id) {
            await sendSSE(data, res);
          }
        }
      });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// 특정 유저에게 메시지 전송
async function sendUserSSE(data, user, groupId) {
  try {
    const userId = user.userId;
    // db 작업 오류시에는 어떻게 대응하지?
    const notification = await Notification.create({ 
      content: data,
      notificationType: 'user',
      receiverId: userId,
    });
    if (clients[`user/${userId}`]) {
      const { res } = clients[`user/${userId}`][0];
      res.lastNotificationId = notification.id;
      await sendSSE(data, res);
    }
    return true;
  } catch(err) {
    return false;
  }
}

// 오프라인 상태인 동안 받지 못한 메시지를 불러와 한 번에 전송
async function getMissedNotifications(groupIds, user) {
  try {
    const lastNotificationId = user.lastNotificationId;
    if (lastNotificationId === null) {
      return true;
    }
    const userId = user.userId;
    const notifications = await Notification.findAll({ 
      where: { 
        [Op.or]: [
          { 
            id: {
              [Op.gt]: lastNotificationId,
            },
            notificationType: 'group', 
            receiverId: {
              [Op.in]: groupIds,
            }, 
          },
          { 
            id: {
              [Op.gt]: lastNotificationId,
            },
            notificationType: 'user',
            receiverId: userId,
          },
        ], 
      }
    });
    if (clients[`user/${userId}`]) {
      const { res } = clients[`user/${userId}`][0];
      notifications.forEach(async (notification) => {
        await sendSSE(notification.content, res);
        res.lastNotificationId = notification.id;
      });
    }
    return true;
  } catch(err) {
    return false;
  }
}

module.exports = {
  clients,
  sseJoin,
  sseLeave,
  sseGroupJoin,
  sseGroupLeave,
  sseGroupRemove,
  sendSSE,
  sendGroupSSE,
  sendUserSSE,
  getMissedNotifications,
};
