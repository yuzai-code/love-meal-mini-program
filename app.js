// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    isAdmin: false, // 管理员模式（可通过管理页开启）
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'love-kitchen', // 替换为你的云环境ID
        traceUser: true,
      });
    }

    // 获取用户信息
    this.getUserInfo();
  },

  getUserInfo() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
            }
          });
        }
      }
    });
  },
});
