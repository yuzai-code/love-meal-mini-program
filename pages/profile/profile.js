// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    mode: 'ordering',
  },

  onLoad() {
    const mode = app.getCurrentMode();
    this.setData({ mode });
  },

  onSwitchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    app.setMode(mode);
    this.setData({ mode });
  },

  onTapCard(e) {
    const type = e.currentTarget.dataset.type;

    if (type === 'manage') {
      wx.navigateTo({ url: '/pages/manage/manage' });
    } else if (type === 'orders' || type === 'myorders') {
      wx.switchTab({ url: '/pages/orders/orders' });
    } else if (type === 'import') {
      wx.showToast({ title: 'V2即将上线', icon: 'none' });
    } else if (type === 'favorite') {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },
});
