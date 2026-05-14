// pages/menu/menu.js
const app = getApp();

Page({
  data: {
    categories: ['全部', '主食', '主菜', '汤', '饮品'],
    currentCategory: '全部',
    dishes: [],
    filteredDishes: [],
    cart: [],
    cartCount: 0,
    totalPrice: 0,
    showCart: false,
    popularDishes: [], // 常点菜品
    searchKey: '',     // 搜索关键词
  },

  onLoad(options) {
    // 从 url 参数读取搜索词
    if (options.searchKey) {
      this.setData({ searchKey: decodeURIComponent(options.searchKey) });
    }
    this.loadDishes();
    this.calculatePopularDishes();
  },

  onShow() {
    // 每次显示页面都刷新菜品数据，确保从管理页添加的菜品能显示
    this.loadDishes();
    // 只在页面重新显示时刷新常点数据
    this.calculatePopularDishes();
  },

  // 加载菜品数据
  loadDishes() {
    const dishes = wx.getStorageSync('dishes') || [];
    // 只显示已上架的菜品
    const enabledDishes = dishes.filter(d => d.enabled !== false);
    this.setData({ dishes: enabledDishes });
    this.filterDishes();
  },

  // 计算常点菜品
  calculatePopularDishes() {
    const orders = wx.getStorageSync('orders') || [];
    const dishCount = {};
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          dishCount[item.dishId] = (dishCount[item.dishId] || 0) + item.num;
        });
      }
    });

    const sorted = Object.entries(dishCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dishId]) => dishId);

    this.setData({ popularDishes: sorted });
  },

  // 搜索输入
  onSearchInput(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.filterDishes();
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ searchKey: '' });
    this.filterDishes();
  },

  // 切换分类
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.filterDishes();
  },

  // 计算高亮文本（返回片段数组）
  getHighlightSegments(dish) {
    if (!this.data.searchKey) {
      return [{ text: dish.name, highlight: false }];
    }
    const key = this.data.searchKey.toLowerCase();
    const name = dish.name;
    const lowerName = name.toLowerCase();
    const index = lowerName.indexOf(key);
    if (index === -1) {
      return [{ text: dish.name, highlight: false }];
    }
    const segments = [];
    if (index > 0) segments.push({ text: name.slice(0, index), highlight: false });
    segments.push({ text: name.slice(index, index + key.length), highlight: true });
    if (index + key.length < name.length) segments.push({ text: name.slice(index + key.length), highlight: false });
    return segments;
  },

  // 筛选菜品
  filterDishes() {
    let dishes = this.data.dishes;
    // 分类筛选
    if (this.data.currentCategory !== '全部') {
      dishes = dishes.filter(d => d.category === this.data.currentCategory);
    }
    // 搜索筛选（按菜品名称模糊匹配）并计算高亮片段
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      dishes = dishes
        .filter(d => d.name.toLowerCase().includes(key))
        .map(d => ({ ...d, nameSegments: this.getHighlightSegments(d) }));
    } else {
      dishes = dishes.map(d => ({ ...d, nameSegments: [{ text: d.name, highlight: false }] }));
    }
    this.setData({ filteredDishes: dishes });
  },

  // 添加到购物车
  addToCart(e) {
    const dish = e.currentTarget.dataset.dish;
    const cart = this.data.cart;
    const index = cart.findIndex(item => item.dishId === dish.id);

    if (index > -1) {
      cart[index].num++;
    } else {
      cart.push({
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        num: 1,
      });
    }

    this.updateCart(cart);
    wx.vibrateShort({ type: 'light' }); // 轻微震动反馈
  },

  // 从购物车减少
  reduceFromCart(e) {
    const dishId = e.currentTarget.dataset.dishid;
    let cart = this.data.cart;
    const index = cart.findIndex(item => item.dishId === dishId);

    if (index > -1) {
      if (cart[index].num > 1) {
        cart[index].num--;
      } else {
        cart.splice(index, 1);
      }
    }

    this.updateCart(cart);
  },

  // 更新购物车
  updateCart(cart) {
    const cartCount = cart.reduce((sum, item) => sum + item.num, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.num, 0);
    this.setData({ cart, cartCount, totalPrice });
  },

  // 显示/隐藏购物车
  toggleCart() {
    this.setData({ showCart: !this.data.showCart });
  },

  // 去结算
  goCheckout() {
    if (this.data.cart.length === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/detail/detail?from=cart' });
  },

  // 清空购物车
  clearCart() {
    this.updateCart([]);
    this.setData({ showCart: false });
  },

  // 跳转详情页（T7修复：menu.wxml的bindtap=goDetail原本死链接）
  goDetail(e) {
    const dishId = e.currentTarget.dataset.dishid;
    wx.navigateTo({ url: '/pages/detail/detail?dishid=' + dishId });
  },
});
