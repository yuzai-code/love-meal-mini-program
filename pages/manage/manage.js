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
      image: '',
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
      formData: { name: '', price: '', description: '', category: '主菜', ingredients: '', steps: '', isPopular: false, image: '' }
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
        image: dish.image || '',
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
        image: formData.image || '/images/default-dish.png',
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

  // 选择图片并上传
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        
        // 上传到 imgbb 图床
        wx.uploadFile({
          url: 'https://api.imgbb.com/1/upload?key=c5e9a4c8e3a5c6d7e9f0a1b2c3d4e5f6',
          filePath: tempFilePath,
          name: 'image',
          success: uploadRes => {
            wx.hideLoading();
            try {
              const data = JSON.parse(uploadRes.data);
              if (data.success) {
                this.setData({ ['formData.image']: data.data.url });
                wx.showToast({ title: '图片上传成功', icon: 'success' });
              } else {
                // imgbb 上传失败，使用本地临时路径作为 fallback
                this.setData({ ['formData.image']: tempFilePath });
                wx.showToast({ title: '图片已选择（本地）', icon: 'none' });
              }
            } catch (e) {
              // 解析失败，使用本地临时路径
              this.setData({ ['formData.image']: tempFilePath });
              wx.showToast({ title: '图片已选择（本地）', icon: 'none' });
            }
          },
          fail: err => {
            wx.hideLoading();
            console.error('上传失败', err);
            // 上传失败时使用本地临时路径作为 fallback
            this.setData({ ['formData.image']: tempFilePath });
            wx.showToast({ title: '图片已选择（本地）', icon: 'none' });
          }
        });
      }
    });
  },
});
