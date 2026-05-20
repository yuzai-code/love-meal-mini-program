// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    mode: 'ordering', // 'cooking' 餐饮模式(商家) | 'ordering' 点餐模式(顾客)
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d3gr163d5e1ce02ec',
        traceUser: true,
      });
    }

    // 恢复保存的模式
    this.globalData.mode = this.getCurrentMode();

    // 获取用户信息
    this.getUserInfo();
  },

  setMode(mode) {
    if (mode === 'cooking' || mode === 'ordering') {
      this.globalData.mode = mode;
      wx.setStorageSync('app_mode', mode);
    }
  },

  getCurrentMode() {
    return wx.getStorageSync('app_mode') || 'ordering';
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
