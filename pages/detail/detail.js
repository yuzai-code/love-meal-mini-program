// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    fromCart: false,
    singleDish: null,
    dishes: [],
    totalPrice: 0,
    note: '',
    address: '',
    isOrderView: false,
  },

  onLoad(options) {
    if (options.from === 'cart') {
      this.setData({ fromCart: true });
      this.loadCartData();
    } else if (options.dishid) {
      this.setData({ fromCart: false });
      this.loadSingleDish(options.dishid);
    } else if (options.orderid) {
      this.setData({ fromCart: true });
      this.loadOrderData(options.orderid);
    }
  },

  loadCartData() {
    const cart = wx.getStorageSync('cart') || [];
    const dishes = wx.getStorageSync('dishes') || [];
    
    const cartItems = cart.map(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      return { ...item, image: dish ? dish.image : '', description: dish ? dish.description : '' };
    });

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.num, 0);
    this.setData({ dishes: cartItems, totalPrice });
  },

  loadSingleDish(dishId) {
    const dishes = wx.getStorageSync('dishes') || [];
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      this.setData({ 
        singleDish: dish, 
        totalPrice: dish.price,
        dishes: [{ ...dish, num: 1, dishId: dish.id }]
      });
    }
  },

  // 加载历史订单数据（用于再来一单）
  loadOrderData(orderId) {
    const orders = wx.getStorageSync('orders') || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const dishes = wx.getStorageSync('dishes') || [];
    const cartItems = order.items.map(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      return { 
        ...item, 
        image: dish ? dish.image : '', 
        description: dish ? dish.description : '' 
      };
    });

    const totalPrice = order.items.reduce((sum, item) => sum + item.price * item.num, 0);
    this.setData({ 
      dishes: cartItems, 
      totalPrice,
      note: order.note || '',
      address: order.address || '',
      isOrderView: true,
    });
  },

  // 再来一单（从详情页操作）
  reorder() {
    const { dishes } = this.data;
    let cart = wx.getStorageSync('cart') || [];
    const unavailable = [];

    dishes.forEach(item => {
      if (!item.image && !item.description) {
        // 没有图片和描述说明是已下架的菜品
        unavailable.push(item.name);
        return;
      }
      const idx = cart.findIndex(c => c.dishId === (item.dishId || item.id));
      if (idx > -1) {
        cart[idx].num += item.num || 1;
      } else {
        cart.push({
          dishId: item.dishId || item.id,
          name: item.name,
          price: item.price,
          num: item.num || 1,
        });
      }
    });

    wx.setStorageSync('cart', cart);

    if (unavailable.length > 0) {
      wx.showModal({
        title: '⚠️ 部分商品无法加入',
        content: '以下菜品已下架：' + unavailable.join('、'),
        showCancel: false,
      });
    }

    wx.navigateTo({ url: '/pages/detail/detail?from=cart' });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onAddressInput(e) {
    this.setData({ address: e.detail.value });
  },

  // 提交订单
  submitOrder() {
    const { dishes, totalPrice, note, address } = this.data;
    
    if (dishes.length === 0) {
      wx.showToast({ title: '请选择菜品', icon: 'none' });
      return;
    }

    const order = {
      id: 'ORD' + Date.now(),
      items: dishes.map(d => ({
        dishId: d.dishId || d.id,
        name: d.name,
        price: d.price,
        num: d.num || 1,
      })),
      totalPrice,
      note,
      address,
      status: 'pending',
      createTime: new Date().toLocaleString('zh-CN'),
    };

    // 保存订单
    const orders = wx.getStorageSync('orders') || [];
    orders.unshift(order);
    wx.setStorageSync('orders', orders);

    // 清空购物车
    wx.removeStorageSync('cart');

    // 发送微信通知（云开发）
    this.sendNotification(order);

    wx.showModal({
      title: '❤️ 下单成功！',
      content: '厨师小哥哥收到订单啦～',
      showCancel: false,
      success: () => {
        wx.switchTab({ url: '/pages/orders/orders' });
      }
    });
  },

  // 发送微信服务通知
  sendNotification(order) {
    wx.cloud.callFunction({
      name: 'notifyOrder',
      data: {
        action: 'notify',
        order,
      },
      success: res => {
        console.log('通知发送成功', res);
      },
      fail: err => {
        console.error('通知发送失败', err);
      }
    });
  },
});
