// Model
const Notification = require('../models/notifications');

const clients = {};

async function sendSSE(data, res) {
  res.write(`data: ${data}\n\n`);
}

async function sendGroupSSE(data, user, group) {
  try {
    const { userId } = user;
    const { groupId } = group;
    console.log(userId);
    const members = (await group.getUsers()).map((member) => member.userId);
    console.log(members);
    const notifications = [];
    members.forEach((id) => {
      if (userId !== id) {
        notifications.push({
          content: data,
          userId: id,
        });
      }
    });
    await Notification.bulkCreate(notifications);
    const groupClients = clients[`group/${groupId}`];
    if (groupClients) {
      console.log(groupClients);
      groupClients.forEach(async (member) => {
        if (clients[`user/${user.id}`]) {
          const { res } = clients[`user/${member.id}`][0];
          if (userId !== member.id) {
            await sendSSE(`${data} (${new Date()})`, res);
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
async function sendUserSSE(data, user) {
  try {
    const { userId } = user;
    await Notification.create({
      content: data,
      userId,
    });
    if (clients[`user/${userId}`]) {
      const { res } = clients[`user/${userId}`][0];
      await sendSSE(data, res);
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function sseJoin(groupIds, userId, res) {
  clients[`user/${userId}`] = [{ id: userId, res }];
  groupIds.forEach(async (groupId) => {
    if (!clients[`group/${groupId}`]) {
      clients[`group/${groupId}`] = [];
    }
    clients[`group/${groupId}`].push({ id: userId });
  });
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

async function sseGroupJoin(group, user) {
  const { userId } = user;
  const { groupId } = group;

  if (!clients[`group/${groupId}`]) {
    clients[`group/${groupId}`] = [];
  }
  clients[`group/${groupId}`].push({ id: userId });
  sendGroupSSE(`${user.nickname}님이 그룹에 참여하였습니다.`, user, group);
  console.log(clients);
}

async function sseGroupLeave(groupId, user) {
  const { userId } = user;
  const groupClients = clients[`group/${groupId}`];
  const index = groupClients.findIndex((member) => member.id === userId);
  if (index !== -1) {
    groupClients.splice(index, 1);
  }
  console.log(clients);
}

async function sseGroupRemove(groupId) {
  delete clients[`group/${groupId}`];
  console.log(clients);
}

// 오프라인 상태인 동안 받지 못한 메시지를 불러와 한 번에 전송
async function loadNotifications(user) {
  try {
    const { userId } = user;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });
    if (clients[`user/${userId}`]) {
      const { res } = clients[`user/${userId}`][0];
      notifications.forEach(async (notification) => {
        await sendSSE(`${notification.content} (${notification.createdAt})`, res);
      });
    }
    return true;
  } catch (err) {
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
  loadNotifications,
};
