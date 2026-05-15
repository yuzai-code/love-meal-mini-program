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
      const url = this.data.list[index].pagePath;

      // 使用 switchTab 直接切换，页面切换后 pageLifetimes.show 会自动更新 selected
      wx.switchTab({ url });
    },

    getTabBarSelected() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) {
        return 0;
      }

      // 兼容不同基础库：优先用 route，其次用 __route__，最后用全路径匹配
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return 0;

      const route = currentPage.route || currentPage.__route__ || '';
      
      // 三种匹配方式都尝试，兼容不同格式的 route 值
      let index = this.data.list.findIndex(item => {
        const pagePath = item.pagePath;
        // 方式1：直接等于（去掉前导斜线）
        const pageName = pagePath.startsWith('/') ? pagePath.slice(1) : pagePath; // '/pages/menu/menu' → 'pages/menu/menu'
        if (route === pageName) return true;
        // 方式2：route 包含页面路径（如 route='pages/menu/menu'，pageName='menu/menu'）
        const shortName = pageName.split('/pages/')[1] || pageName; // 'pages/menu/menu' → 'menu/menu'
        if (route === shortName) return true;
        // 方式3：pagePath 直接包含 route
        if (pagePath.includes(route)) return true;
        return false;
      });

      return index > -1 ? index : 0;
    }
  }
});
