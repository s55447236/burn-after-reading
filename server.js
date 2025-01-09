const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('正在初始化服务器...');

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());
app.use(express.json());
console.log('已启用 CORS 和 JSON 解析...');

// 存储消息的 Map
const messages = new Map();

// 清理过期消息
setInterval(() => {
    const now = Date.now();
    for (const [id, msg] of messages) {
        if (now - msg.createdAt > 5 * 60 * 1000) {
            messages.delete(id);
        }
    }
}, 60000);

// API 路由
app.post('/api/messages', (req, res) => {
    console.log('收到新消息请求:', req.body);
    const { message } = req.body;
    const id = Math.random().toString(36).substr(2, 8);
    
    messages.set(id, {
        content: message,
        createdAt: Date.now()
    });

    console.log('消息已保存，ID:', id);
    res.json({ id });
});

app.get('/api/messages', (req, res) => {
    console.log('收到获取消息请求:', req.query);
    const id = req.query.id;
    const message = messages.get(id);

    if (!message) {
        console.log('消息不存在:', id);
        return res.status(404).json({ error: '消息不存在或已被销毁' });
    }

    console.log('返回消息:', id, message);
    messages.delete(id);
    res.json({ content: message.content });
});

// 服务静态文件
app.use('/style.css', express.static(path.join(__dirname, 'public', 'style.css')));
app.use('/script.js', express.static(path.join(__dirname, 'public', 'script.js')));

// 处理所有其他路由，包括根路由和 /view/* 路由
app.get('*', (req, res) => {
    console.log('处理页面请求:', req.path);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`服务器启动成功，运行在 http://192.168.1.50:${port}`);
    console.log('监听所有网络接口 (0.0.0.0)');
    
    // 打印所有网络接口
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    console.log('\n可用网络接口:');
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        for (const interface of interfaces) {
            if (interface.family === 'IPv4') {
                console.log(`${name}: ${interface.address}`);
            }
        }
    }
    
    console.log('\n等待连接...');
}); 