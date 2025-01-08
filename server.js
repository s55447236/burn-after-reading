const express = require('express');
const app = express();
const path = require('path');
const crypto = require('crypto');

app.use(express.json());
app.use(express.static('public'));

// 存储消息的对象（实际项目中应该使用数据库）
const messages = new Map();

// 生成随机ID
function generateId() {
    return crypto.randomBytes(4).toString('hex');
}

// 提供静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 创建新消息
app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    const id = generateId();
    messages.set(id, {
        content: message,
        createdAt: Date.now()
    });
    
    // 5分钟后自动删除消息
    setTimeout(() => {
        messages.delete(id);
    }, 5 * 60 * 1000);
    
    res.json({ id });
});

// 获取消息
app.get('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const message = messages.get(id);
    
    if (!message) {
        return res.status(404).json({ error: '消息不存在或已被销毁' });
    }
    
    // 读取后立即删除消息
    messages.delete(id);
    res.json({ content: message.content });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 