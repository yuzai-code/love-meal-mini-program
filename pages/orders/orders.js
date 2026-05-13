// pages/orders/orders.js
const app = getApp();

Page({
  data: {
    orders: [],
    filter: 'all', // all, pending, completed
    currentOrders: [],
  },

  onShow() {
    this.loadOrders();
  },

  onLoad() {
    this.loadOrders();
  },

  loadOrders() {
    const orders = wx.getStorageSync('orders') || [];
    this.setData({ orders, currentOrders: orders });
  },

  // 切换筛选
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ filter });
    this.filterOrders();
  },

  filterOrders() {
    let orders = this.data.orders;
    if (this.data.filter !== 'all') {
      orders = orders.filter(o => o.status === this.data.filter);
    }
    this.setData({ currentOrders: orders });
  },

  // 接单（厨师操作）
  acceptOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    this.updateOrderStatus(orderId, 'accepted');
  },

  // 完成订单（厨师操作）
  completeOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    this.updateOrderStatus(orderId, 'completed');
  },

  // 取消订单
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      confirmText: '确定取消',
      cancelText: '暂不取消',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '取消原因（可选）',
            editable: true,
            placeholderText: '请输入取消原因（选填）',
            success: (res2) => {
              const cancelReason = res2.content || '';
              this.updateOrderStatus(orderId, 'cancelled', cancelReason);
            },
          });
        }
      },
    });
  },

  // 更新订单状态
  updateOrderStatus(orderId, status, cancelReason) {
    const orders = wx.getStorageSync('orders') || [];
    const index = orders.findIndex(o => o.id === orderId);
    if (index > -1) {
      orders[index].status = status;
      if (status === 'cancelled' && cancelReason) {
        orders[index].cancelReason = cancelReason;
      }
      wx.setStorageSync('orders', orders);
      const displayOrders = this.data.filter === 'all'
        ? orders
        : orders.filter(o => o.status === this.data.filter);
      this.setData({ orders, currentOrders: displayOrders });
      const statusMsg = status === 'cancelled' ? '已取消' : status === 'completed' ? '已完成' : '已接单';
      wx.showToast({ title: status === 'cancelled' ? '❌ 已取消' : '✅ ' + statusMsg, icon: 'success' });
    }
  },

  // 查看详情
  goDetail(e) {
    const orderId = e.currentTarget.dataset.orderid;
    wx.navigateTo({ url: '/pages/detail/detail?orderid=' + orderId });
  },

  // 再来一单
  reorder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    const orders = wx.getStorageSync('orders') || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const dishes = wx.getStorageSync('dishes') || [];
    let cart = wx.getStorageSync('cart') || [];
    const unavailable = [];

    order.items.forEach(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      if (!dish) {
        unavailable.push(item.name);
        return;
      }
      const idx = cart.findIndex(c => c.dishId === item.dishId);
      if (idx > -1) {
        cart[idx].num += item.num;
      } else {
        cart.push({
          dishId: item.dishId,
          name: item.name,
          price: item.price,
          num: item.num,
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
});
