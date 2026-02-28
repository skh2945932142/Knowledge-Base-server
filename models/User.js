const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// --- 中间件：保存前自动加密密码 (修复版) ---
// 改用 async function，去掉 next 参数，彻底解决 "next is not a function" 报错
UserSchema.pre('save', async function() {
  const user = this;
  
  // 如果密码没改过，直接返回，不执行后面逻辑
  if (!user.isModified('password')) return;
  
  try {
    // 生成盐并加密 (使用 await 确保加密完成再保存)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (err) {
    // 如果加密出错，抛出错误阻止保存
    throw new Error('密码加密失败');
  }
});

module.exports = mongoose.model('User', UserSchema);