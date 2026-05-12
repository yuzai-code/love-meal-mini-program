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

  pageLifetimes: {
    show() {
      // 每次页面显示时更新选中状态
      this.setData({ selected: this.getTabBarSelected() });
    }
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      if (index === this.data.selected) return; // 防止重复切换
      
      const url = this.data.list[index].pagePath;
      
      // 先切换页面，页面切换后 attached 会自动更新 selected 状态
      wx.switchTab({ url });
    },

    getTabBarSelected() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) return 0;
      
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return 0;
      
      const route = currentPage.route || currentPage.__route__;
      // 精确匹配：提取 pagePath 中的页面名称进行对比
      const index = this.data.list.findIndex(item => {
        const pageName = item.pagePath.split('/pages/')[1]; // e.g. 'menu/menu'
        return pageName === route || pageName.startsWith(route + '/');
      });
      return index > -1 ? index : 0;
    }
  }
});
