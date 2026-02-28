const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 引入模型
const User = require('./models/User');
const Note = require('./models/Note');

const SECRET_KEY = 'my_secret_key_123'; 
const app = express();

app.use(cors());
app.use(express.json());

// 连接数据库
mongoose.connect('mongodb://127.0.0.1:27017/vuedemo')
  .then(() => console.log('✅ MongoDB 数据库连接成功！'))
  .catch(err => console.error('❌ MongoDB 连接失败:', err));

// ==========================================
// 🛡️ 中间件：Token 身份验证 (保安)
// ==========================================
const auth = async (req, res, next) => {
  try {
    // 前端发来的 Token 长这样：Bearer eyJhbGci...
    const raw = String(req.headers.authorization).split(' ').pop();
    const { id } = jwt.verify(raw, SECRET_KEY);
    req.user = await User.findById(id); // 把找到的用户挂载到 req 上
    next(); // 放行
  } catch (err) {
    res.status(401).send({ message: '请先登录' });
  }
};

// ==========================================
// 🚀 接口区域
// ==========================================

// 1. 注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send({ message: '不能为空' });
    const user = await User.create({ username, password });
    res.send({ code: 200, message: '注册成功', user });
  } catch (err) {
    res.status(422).send({ message: err.code === 11000 ? '用户名已存在' : '注册失败' });
  }
});

// 2. 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(422).send({ message: '账号或密码错误' });
  }
  const token = jwt.sign({ id: String(user._id) }, SECRET_KEY);
  res.send({ code: 200, message: '登录成功', token, user: { id: user._id, username: user.username } });
});



// 4. 新建笔记 (需要登录)
app.post('/api/notes', auth, async (req, res) => {
  const note = await Note.create({
    title: '无标题笔记',
    content: '',
    userId: req.user._id // 记在她名下
  });
  res.send(note);
});

// 5. 保存/更新笔记 (需要登录)
app.put('/api/notes/:id', auth, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id }, // 确保只能改自己的
    req.body,
    { new: true } // 返回改完后的最新数据
  );
  res.send(note);
});

// 6. 删除笔记 (需要登录)
app.delete('/api/notes/:id', auth, async (req, res) => {
    // 软删除
    await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isDelete: true }
    );
    res.send({ message: '删除成功' });
});

// 启动
app.listen(3000, () => console.log('🚀 服务运行在 http://localhost:3000'));