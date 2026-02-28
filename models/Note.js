// server/models/Note.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, default: '无标题笔记' },
  content: { type: String, default: '' },
  // 关键字段：关联到 User 表，通过这个字段知道笔记是谁的
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDelete: { type: Boolean, default: false } // 软删除标记（进回收站）
}, { 
  timestamps: true // 自动管理 createdAt 和 updatedAt
});

module.exports = mongoose.model('Note', NoteSchema);