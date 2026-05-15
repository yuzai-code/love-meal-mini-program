// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// ⚠️ 请在微信小程序后台「功能」→「订阅消息」中添加模板，
//    模板标题：「订单状态通知」，字段：{{phrase1.DATA}}{{date2.DATA}}{{amount3.DATA}}{{item4.DATA}}
//    然后将获取到的模板 ID 填入下方（替换 'YOUR_TEMPLATE_ID'）：
const TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // 示例：'AbcDeFgHiJkLmN1234567890'

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

    // 占位符检测：发送前给出友好提示
    if (TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      console.warn('【警告】模板 ID 仍为占位符，请前往微信小程序后台配置真实模板 ID');
      return { success: false, error: '模板 ID 未配置，请联系管理员在微信小程序后台添加「订单状态通知」模板' };
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
      templateId: TEMPLATE_ID, // ⚠️ 请替换为实际的模板 ID
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
