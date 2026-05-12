// components/custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#FF6347',
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

  lifetimes: {
    attached() {
      // 延迟一点执行，确保页面栈已初始化
      setTimeout(() => {
        this.setData({ selected: this.getTabBarSelected() });
      }, 100);
    }
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const url = this.data.list[index].pagePath;
      
      // 先更新状态视觉反馈，再切换
      this.setData({ selected: index });
      
      setTimeout(() => {
        wx.switchTab({ url });
      }, 50);
    },

    getTabBarSelected() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) return 0;
      
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return 0;
      
      const route = currentPage.route || currentPage.__route__;
      const index = this.data.list.findIndex(item => item.pagePath.includes(route));
      return index > -1 ? index : 0;
    }
  }
});
