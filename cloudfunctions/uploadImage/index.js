// 云函数：上传图片到腾讯云COS
// 注意：请在微信开发者工具云开发控制台中配置环境变量：TENCENT_SECRET_ID, TENCENT_SECRET_KEY
const cloud = require('wx-server-sdk');
const cos = require('cos-nodejs-sdk-v5');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 从环境变量获取密钥（请在云开发控制台配置）
const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';

// 初始化 COS 客户端
const cosClient = new cos({
  SecretId: SECRET_ID,
  SecretKey: SECRET_KEY,
  Protocol: 'https:'
});

exports.main = async (event, context) => {
  const { fileContent, fileName } = event;
  
  if (!fileContent) {
    return { success: false, error: '缺少图片数据' };
  }
  
  if (!SECRET_ID || !SECRET_KEY) {
    return { success: false, error: '未配置腾讯云密钥' };
  }
  
  // 生成唯一文件名
  const ext = fileName ? fileName.split('.').pop() : 'jpg';
  const key = `dish-images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
  
  return new Promise((resolve, reject) => {
    cosClient.putObject({
      Bucket: 'images-1316106379',
      Region: 'ap-shanghai',
      Key: key,
      Body: Buffer.from(fileContent, 'base64'),
      ContentLength: Buffer.from(fileContent, 'base64').length,
    }, (err, data) => {
      if (err) {
        console.error('COS上传失败:', err);
        resolve({ success: false, error: err.message || '上传失败' });
      } else {
        // 返回公网访问URL
        const imageUrl = `https://images-1316106379.cos.ap-shanghai.myqcloud.com/${key}`;
        resolve({ 
          success: true, 
          url: imageUrl,
          key: key
        });
      }
    });
  });
};
