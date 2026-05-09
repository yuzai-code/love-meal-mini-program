// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, order } = event;

  switch (action) {
    case 'notify':
      return await sendOrderNotification(order);
    case 'getOpenid':
      return await getOpenid();
    default:
      return { success: false, message: '未知操作' };
  }
};

// 发送订单通知
async function sendOrderNotification(order) {
  try {
    // 获取管理员 OpenID（可以从数据库或配置中获取）
    const adminList = await db.collection('admin').get();
    
    if (adminList.data.length === 0) {
      return { success: false, message: '未设置管理员' };
    }

    // 发送服务通知
    const sendResult = await cloud.openapi.subscribeMessage.send({
      touser: adminList.data[0].openid,
      page: '/pages/orders/orders',
      data: {
        phrase1: { value: order.status === 'pending' ? '新订单' : '订单更新' },
        date2: { value: order.createTime },
        amount3: { value: '¥' + order.totalPrice },
        item4: { value: order.items.map(i => i.name + '×' + i.num).join(', ') },
      },
      templateId: 'YOUR_TEMPLATE_ID', // 需在微信小程序后台添加模板
    });

    return { success: true, result: sendResult };
  } catch (err) {
    console.error('发送通知失败', err);
    return { success: false, error: err.message };
  }
}

// 获取 OpenID
async function getOpenid() {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
  };
}
