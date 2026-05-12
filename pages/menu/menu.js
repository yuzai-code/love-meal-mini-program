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
  },

  onLoad() {
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
    this.setData({ dishes, filteredDishes: dishes });
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

  // 切换分类
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.filterDishes();
  },

  // 筛选菜品
  filterDishes() {
    let dishes = this.data.dishes;
    if (this.data.currentCategory !== '全部') {
      dishes = dishes.filter(d => d.category === this.data.currentCategory);
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
});
