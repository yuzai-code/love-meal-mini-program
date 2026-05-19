// pages/manage/manage.js
const app = getApp();

Page({
  data: {
    isAuthorized: false, // 权限校验标记
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
    // 权限校验：只有商家模式才能访问管理页
    const mode = app.globalData.mode;
    if (mode !== 'cooking') {
      this.setData({ isAuthorized: false });
      wx.showModal({
        title: '⚠️ 无权访问',
        content: '管理功能仅对管理员开放，请联系管理员开通权限。',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/menu/menu' });
        }
      });
      return;
    }
    this.setData({ isAuthorized: true });
    this.loadDishes();
  },

  loadDishes() {
    const dishes = wx.getStorageSync('dishes') || [];
    this.setData({ dishes });
  },

  // 打开新增表单
  onAddDish() {
    if (!this.data.isAuthorized) return;
    this.setData({
      showForm: true,
      editingDish: null,
      formData: { name: '', price: '', description: '', category: '主菜', ingredients: '', steps: '', isPopular: false, image: '' }
    });
  },

  // 打开编辑表单
  onEditDish(e) {
    if (!this.data.isAuthorized) return;
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

  // 输入处理（T9修复：价格负数截断 + 保存时>0验证）
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    if (field === 'price') {
      value = parseFloat(value) || 0;
      if (value < 0) value = 0; // 负数截断为0
    }
    if (field === 'isPopular') value = e.detail.value.length > 0;
    this.setData({ ['formData.' + field]: value });
  },

  // 选择分类
  onCategoryChange(e) {
    const categories = this.data.categories;
    const index = parseInt(e.detail.value);
    this.setData({ ['formData.category']: categories[index] });
  },

  // 保存菜品（T9修复：价格必须>0）
  onSave() {
    if (!this.data.isAuthorized) return;
    const { formData, editingDish } = this.data;
    if (!formData.name || !formData.price) {
      wx.showToast({ title: '请填写名称和价格', icon: 'none' });
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      wx.showToast({ title: '价格必须大于0', icon: 'none' });
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
        enabled: true,
      });
    }

    wx.setStorageSync('dishes', dishes);
    this.setData({ showForm: false });
    this.loadDishes();
    wx.showToast({ title: editingDish ? '已更新' : '已添加', icon: 'success' });
  },

  // 删除菜品
  onDeleteDish(e) {
    if (!this.data.isAuthorized) return;
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

  // 切换菜品上架/下架状态
  onToggleEnabled(e) {
    if (!this.data.isAuthorized) return;
    const dishId = e.currentTarget.dataset.dishid;
    const dishes = wx.getStorageSync('dishes') || [];
    const index = dishes.findIndex(d => d.id === dishId);
    if (index > -1) {
      dishes[index].enabled = !dishes[index].enabled;
      wx.setStorageSync('dishes', dishes);
      this.loadDishes();
      wx.showToast({
        title: dishes[index].enabled ? '已上架' : '已下架',
        icon: 'success'
      });
    }
  },

  // 选择图片并上传到腾讯云COS
  onChooseImage() {
    if (!this.data.isAuthorized) return;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });

        // 读取图片文件并转为 base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: readRes => {
            const fileContent = readRes.data;

            // 调用云函数上传到腾讯云COS（增加超时）
            wx.cloud.callFunction({
              name: 'uploadImage',
              data: {
                fileContent: fileContent,
                fileName: tempFilePath.split('/').pop()
              },
              timeout: 30000,  // 30秒超时
              success: callRes => {
                wx.hideLoading();
                // 修复：增加 callRes.result 是否存在的检查
                if (!callRes.result) {
                  wx.showToast({ title: '上传失败：云函数无响应', icon: 'none' });
                  return;
                }
                if (callRes.result.success) {
                  this.setData({ ['formData.image']: callRes.result.url });
                  wx.showToast({ title: '图片上传成功', icon: 'success' });
                } else {
                  wx.showToast({ title: callRes.result.error || '上传失败', icon: 'none' });
                }
              },
              fail: err => {
                wx.hideLoading();
                console.error('云函数调用失败', err);
                wx.showToast({ title: '云函数调用失败，请检查网络', icon: 'none' });
              }
            });
          },
          fail: err => {
            wx.hideLoading();
            console.error('读取文件失败', err);
            wx.showToast({ title: '读取图片失败', icon: 'none' });
          }
        });
      }
    });
  },
});
