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

  // 更新订单状态
  updateOrderStatus(orderId, status) {
    const orders = wx.getStorageSync('orders') || [];
    const index = orders.findIndex(o => o.id === orderId);
    if (index > -1) {
      orders[index].status = status;
      wx.setStorageSync('orders', orders);
      this.setData({ orders, currentOrders: this.data.filter === 'all' ? orders : orders.filter(o => o.status === this.data.filter) });
      wx.showToast({ title: status === 'completed' ? '✅ 已完成！' : '已接单', icon: 'success' });
    }
  },

  // 查看详情
  goDetail(e) {
    const orderId = e.currentTarget.dataset.orderid;
    wx.navigateTo({ url: '/pages/detail/detail?orderid=' + orderId });
  },
});
