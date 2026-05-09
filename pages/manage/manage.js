// pages/manage/manage.js
Page({
  data: {
    dishes: [],
    showForm: false,
    editingDish: null,
    formData: {
      name: '',
      price: '',
      description: '',
      category: '主菜',
      ingredients: '',
      steps: '',
      isPopular: false,
    },
    categories: ['主食', '主菜', '汤', '饮品'],
  },

  onShow() {
    this.loadDishes();
  },

  loadDishes() {
    const dishes = wx.getStorageSync('dishes') || [];
    this.setData({ dishes });
  },

  // 打开新增表单
  onAddDish() {
    this.setData({
      showForm: true,
      editingDish: null,
      formData: { name: '', price: '', description: '', category: '主菜', ingredients: '', steps: '', isPopular: false }
    });
  },

  // 打开编辑表单
  onEditDish(e) {
    const dish = e.currentTarget.dataset.dish;
    this.setData({
      showForm: true,
      editingDish: dish,
      formData: {
        name: dish.name,
        price: dish.price,
        description: dish.description || '',
        category: dish.category || '主菜',
        ingredients: dish.ingredients || '',
        steps: dish.steps || '',
        isPopular: dish.isPopular || false,
      }
    });
  },

  // 关闭表单
  onCloseForm() {
    this.setData({ showForm: false });
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    if (field === 'price') value = parseFloat(value) || 0;
    if (field === 'isPopular') value = e.detail.value.length > 0;
    this.setData({ ['formData.' + field]: value });
  },

  // 选择分类
  onCategoryChange(e) {
    const categories = this.data.categories;
    const index = parseInt(e.detail.value);
    this.setData({ ['formData.category']: categories[index] });
  },

  // 保存菜品
  onSave() {
    const { formData, editingDish } = this.data;
    if (!formData.name || !formData.price) {
      wx.showToast({ title: '请填写名称和价格', icon: 'none' });
      return;
    }

    let dishes = wx.getStorageSync('dishes') || [];
    
    if (editingDish) {
      const index = dishes.findIndex(d => d.id === editingDish.id);
      if (index > -1) {
        dishes[index] = { ...editingDish, ...formData };
      }
    } else {
      dishes.push({
        id: 'D' + Date.now(),
        ...formData,
        image: '/images/default-dish.png',
        status: 'available',
      });
    }

    wx.setStorageSync('dishes', dishes);
    this.setData({ showForm: false });
    this.loadDishes();
    wx.showToast({ title: editingDish ? '已更新' : '已添加', icon: 'success' });
  },

  // 删除菜品
  onDeleteDish(e) {
    const dishId = e.currentTarget.dataset.dishid;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道菜吗？',
      success: res => {
        if (res.confirm) {
          let dishes = wx.getStorageSync('dishes') || [];
          dishes = dishes.filter(d => d.id !== dishId);
          wx.setStorageSync('dishes', dishes);
          this.loadDishes();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 上传图片（实际需要使用 wx.chooseImage，这里简化）
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        // 实际上传云存储...
        wx.showToast({ title: '图片已选择（需上传云存储）', icon: 'none' });
      }
    });
  },
});
