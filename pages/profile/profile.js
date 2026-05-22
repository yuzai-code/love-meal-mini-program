// pages/profile/profile.js
const app = getApp();

// 简单哈希：base64编码（不求强加密，只求不明文存储）
function hashPassword(password) {
  // btoa 在 Node.js 环境中可能不存在，这里用 Buffer
  try {
    return Buffer.from(password).toString('base64');
  } catch (e) {
    return password;
  }
}

Page({
  data: {
    mode: 'ordering',
  },

  // 密码验证状态（内存中，不持久化）
  _passwordAttempts: 0,      // 连续错误次数
  _passwordLockedUntil: 0,   // 锁定截止时间戳

  onLoad() {
    const mode = app.getCurrentMode();
    // 从 storage 恢复锁定状态
    const lockedUntil = wx.getStorageSync('mode_locked_until');
    if (lockedUntil) {
      this._passwordLockedUntil = lockedUntil;
    }
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
                const hashed = hashPassword(password);
                wx.setStorageSync('mode_switch_password', hashed);
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
          if (inputPwd.length < 4) {
            wx.showToast({ title: '密码至少4位', icon: 'none' });
            return;
          }
          const hashedInput = hashPassword(inputPwd);
          const savedPassword = wx.getStorageSync('mode_switch_password');
          if (hashedInput === savedPassword) {
            // 密码正确，重置错误计数
            self._passwordAttempts = 0;
            self._passwordLockedUntil = 0;
            wx.removeStorageSync('mode_locked_until');
            app.setMode(targetMode);
            self.setData({ mode: targetMode });
          } else {
            // 密码错误
            self._passwordAttempts++;
            if (self._passwordAttempts >= 5) {
              // 锁定1分钟
              self._passwordLockedUntil = Date.now() + 60000;
              wx.setStorageSync('mode_locked_until', self._passwordLockedUntil);
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
          wx.removeStorageSync('mode_locked_until');
          wx.showToast({ title: '密码已重置', icon: 'success' });
        }
      }
    });
  },

  onTapCard(e) {
    const type = e.currentTarget.dataset.type;
    const requiredMode = e.currentTarget.dataset.mode;

    // 检查当前模式是否匹配所需模式
    if (requiredMode && this.data.mode !== requiredMode) {
      wx.showToast({ title: '当前模式不支持此功能', icon: 'none' });
      return;
    }

    if (type === 'manage') {
      wx.navigateTo({ url: '/pages/manage/manage' });
    } else if (type === 'orders') {
      // 点餐模式：查看我的订单；烹饪模式：查看所有订单
      if (this.data.mode === 'ordering') {
        wx.switchTab({ url: '/pages/orders/orders' });
      } else {
        wx.switchTab({ url: '/pages/orders/orders' });
      }
    } else if (type === 'myorders') {
      wx.switchTab({ url: '/pages/orders/orders' });
    } else if (type === 'import') {
      wx.showToast({ title: 'V2即将上线', icon: 'none' });
    } else if (type === 'favorite') {
      this._showFavoriteDishes();
    }
  },

  _showFavoriteDishes() {
    // 从订单历史提取最常订购的菜品
    const orders = wx.getStorageSync('orders') || [];
    const dishCount = {};
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      (order.items || []).forEach(item => {
        if (!dishCount[item.dishId]) {
          dishCount[item.dishId] = { name: item.name, count: 0, dishId: item.dishId, price: item.price };
        }
        dishCount[item.dishId].count += item.num;
      });
    });

    const sorted = Object.values(dishCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (sorted.length === 0) {
      wx.showModal({
        title: '暂无常用菜品',
        content: '完成几笔订单后，这里会显示你最常点的菜',
        showCancel: false,
      });
      return;
    }

    const list = sorted.map((d, i) => `${i + 1}. ${d.name}（共${d.count}份）`).join('\n');
    wx.showModal({
      title: '🍜 常用菜品 TOP5',
      content: list,
      showCancel: false,
    });
  },
});
