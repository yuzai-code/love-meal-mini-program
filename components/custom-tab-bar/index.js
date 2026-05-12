// components/custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#ff6b9d',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: '/pages/menu/menu',
        text: '点餐',
        icon: 'menu',
        selectedIcon: 'menu_active'
      },
      {
        pagePath: '/pages/orders/orders',
        text: '订单',
        icon: 'orders',
        selectedIcon: 'orders_active'
      },
      {
        pagePath: '/pages/manage/manage',
        text: '管理',
        icon: 'manage',
        selectedIcon: 'manage_active'
      }
    ]
  },

  attached() {
    this.setData({ selected: this.getTabBarSelected() });
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const url = this.data.list[index].pagePath;
      
      wx.switchTab({ url });
      
      this.setData({ selected: index });
    },

    getTabBarSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route;
      
      const index = this.data.list.findIndex(item => item.pagePath.includes(route));
      return index > -1 ? index : 0;
    }
  }
});
