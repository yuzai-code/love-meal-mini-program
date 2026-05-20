// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    mode: 'ordering',
  },

  // 密码验证状态（内存中，不持久化）
  _passwordAttempts: 0,      // 连续错误次数
  _passwordLockedUntil: 0,   // 锁定截止时间戳

  onLoad() {
    const mode = app.getCurrentMode();
    this.setData({ mode });
  },

  onSwitchMode(e) {
    const targetMode = e.currentTarget.dataset.mode;
    const currentMode = this.data.mode;

    // 切回低权限模式（烹饪→点餐）无需密码
    if (targetMode === 'ordering') {
      app.setMode(targetMode);
      this.setData({ mode: targetMode });
      return;
    }

    // 点餐→烹饪：需要密码保护
    if (targetMode === 'cooking') {
      this._handleCookingSwitch(targetMode);
    }
  },

  _handleCookingSwitch(targetMode) {
    // 检查是否被锁定
    const now = Date.now();
    if (now < this._passwordLockedUntil) {
      const remainingSec = Math.ceil((this._passwordLockedUntil - now) / 1000);
      wx.showToast({ title: `密码错误次数过多，请${remainingSec}秒后再试`, icon: 'none' });
      return;
    }

    const savedPassword = wx.getStorageSync('mode_switch_password');

    if (!savedPassword) {
      // 首次设置密码
      this._showSetPasswordDialog(targetMode);
    } else {
      // 验证密码
      this._showVerifyPasswordDialog(targetMode);
    }
  },

  _showSetPasswordDialog(targetMode) {
    const self = this;
    wx.showModal({
      title: '设置切换密码',
      content: '请设置4位数字密码，保护烹饪模式',
      editable: true,
      placeholderText: '请输入4位数字密码',
      success(res) {
        if (res.confirm && res.content) {
          const password = res.content.trim();
          if (!/^\d{4}$/.test(password)) {
            wx.showToast({ title: '密码必须是4位数字', icon: 'none' });
            return;
          }
          // 确认密码
          wx.showModal({
            title: '确认密码',
            content: '请再次输入密码',
            editable: true,
            placeholderText: '请再次输入4位数字密码',
            success(res2) {
              if (res2.confirm && res2.content) {
                const confirmPwd = res2.content.trim();
                if (password !== confirmPwd) {
                  wx.showToast({ title: '两次密码不一致', icon: 'none' });
                  return;
                }
                wx.setStorageSync('mode_switch_password', password);
                app.setMode(targetMode);
                self.setData({ mode: targetMode });
                wx.showToast({ title: '密码设置成功', icon: 'success' });
              }
            }
          });
        }
      }
    });
  },

  _showVerifyPasswordDialog(targetMode) {
    const self = this;
    const remaining = 5 - this._passwordAttempts;
    wx.showModal({
      title: '输入密码',
      content: `请输入4位数字密码（剩余${remaining}次机会）`,
      editable: true,
      placeholderText: '请输入4位数字密码',
      success(res) {
        if (res.confirm && res.content) {
          const inputPwd = res.content.trim();
          const savedPassword = wx.getStorageSync('mode_switch_password');
          if (inputPwd === savedPassword) {
            // 密码正确，重置错误计数
            self._passwordAttempts = 0;
            self._passwordLockedUntil = 0;
            app.setMode(targetMode);
            self.setData({ mode: targetMode });
          } else {
            // 密码错误
            self._passwordAttempts++;
            if (self._passwordAttempts >= 5) {
              // 锁定1分钟
              self._passwordLockedUntil = Date.now() + 60000;
              self._passwordAttempts = 0;
              wx.showToast({ title: '密码错误，已锁定1分钟', icon: 'none' });
            } else {
              wx.showToast({
                title: `密码不正确，剩余${5 - self._passwordAttempts}次机会`,
                icon: 'none'
              });
            }
          }
        }
      }
    });
  },

  onResetPassword() {
    // 仅在烹饪模式下可用
    if (this.data.mode !== 'cooking') return;

    wx.showModal({
      title: '重置切换密码',
      content: '确定要重置切换密码吗？重置后再次进入烹饪模式需要重新设置密码',
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('mode_switch_password');
          wx.showToast({ title: '密码已重置', icon: 'success' });
        }
      }
    });
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
