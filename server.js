require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const CryptoJS = require('crypto-js');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 内存中存储消息（生产环境应该使用数据库）
const messages = new Map();

// 详细的请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n=== 新请求 ===`);
    console.log(`时间: ${new Date().toISOString()}`);
    console.log(`方法: ${req.method}`);
    console.log(`URL: ${req.url}`);
    
    // 记录响应
    const oldSend = res.send;
    res.send = function(data) {
        try {
            console.log(`响应状态: ${res.statusCode}`);
            console.log(`响应时间: ${Date.now() - start}ms`);
            oldSend.apply(res, arguments);
        } catch (err) {
            console.error('发送响应时出错:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: '服务器错误' });
            }
        }
    };
    
    next();
});

// 测试路由 - 检查服务器状态
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        staticFiles: {
            publicDir: path.resolve(__dirname, 'public'),
            exists: require('fs').existsSync(path.resolve(__dirname, 'public')),
            files: require('fs').readdirSync(path.resolve(__dirname, 'public'))
        }
    });
});

// 安全中间件配置
app.use(helmet({
    contentSecurityPolicy: false,  // 暂时禁用 CSP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false
}));

// CORS 配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// 速率限制
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // 限制100个请求
});

// API 路由和中间件
app.use('/api', express.json());
app.use('/api', limiter);

// 静态文件服务 - 确保在其他路由之前
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    setHeaders: (res, filePath) => {
        console.log('请求静态文件:', filePath);
        
        // 根据文件类型设置正确的 Content-Type
        if (filePath.endsWith('.css')) {
            console.log('设置 CSS 文件头部');
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            console.log('设置 JS 文件头部');
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            console.log('设置 HTML 文件头部');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        
        // 设置跨域和缓存控制
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// 加密函数
function encrypt(text) {
    return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
}

// 解密函数
function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// 创建消息
app.post('/api/messages', (req, res) => {
    console.log('收到创建消息请求:', {
        body: req.body,
        headers: req.headers
    });
    
    try {
        const { message, effect } = req.body;
        
        if (!message) {
            console.log('消息内容为空');
            return res.status(400).json({ error: '消息内容不能为空' });
        }
        
        if (message.length > 10000) {
            console.log('消息内容过长:', message.length);
            return res.status(400).json({ error: '消息内容过长，最大长度为10000字符' });
        }

        if (!effect) {
            console.log('未指定特效，使用默认特效: explosion');
        }

        const id = nanoid(10);
        console.log('生成消息ID:', id);
        
        try {
            const encryptedMessage = encrypt(message);
            console.log('消息加密成功');
            
            // 存储消息
            messages.set(id, {
                content: encryptedMessage,
                effect: effect || 'explosion',
                createdAt: Date.now(),
                ttl: parseInt(process.env.MESSAGE_TTL) || 3600000
            });
            
            console.log('消息存储成功');

            // 设置自动删除
            setTimeout(() => {
                if (messages.delete(id)) {
                    console.log(`消息 ${id} 已过期自动删除`);
                }
            }, parseInt(process.env.MESSAGE_TTL) || 3600000);

            console.log('响应客户端:', { id });
            res.json({ id });
        } catch (encryptError) {
            console.error('消息加密失败:', encryptError);
            res.status(500).json({ error: '消息加密失败' });
        }
    } catch (error) {
        console.error('创建消息时发生错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取消息
app.get('/api/messages', (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ error: '消息ID无效' });
        }

        const message = messages.get(id);
        
        if (!message) {
            return res.status(404).json({ error: '消息不存在或已被销毁' });
        }

        // 解密消息
        const decryptedContent = decrypt(message.content);
        
        // 立即删除消息
        messages.delete(id);

        res.json({
            content: decryptedContent,
            effect: message.effect
        });
    } catch (error) {
        console.error('获取消息错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 处理 /view/ 路径的路由 - 移到静态文件服务之后
app.get('/view/:id', (req, res) => {
    console.log(`处理 /view 路径请求: ${req.url}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'), {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
});

// SPA 路由处理 - 保持在最后
app.get('*', (req, res) => {
    console.log(`处理通配符路由请求: ${req.url}`);
    if (req.url === '/') {
        res.sendFile(path.join(__dirname, 'public', 'index.html'), {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } else {
        res.status(404).send('Not Found');
    }
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    // 不退出进程
    console.log('服务器继续运行...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
    // 不退出进程
    console.log('服务器继续运行...');
});

// 防止内存泄漏
setInterval(() => {
    // 清理过期的消息
    const now = Date.now();
    for (const [id, message] of messages.entries()) {
        if (now - message.createdAt > message.ttl) {
            messages.delete(id);
            console.log(`清理过期消息: ${id}`);
        }
    }
    // 打印服务器状态
    console.log(`服务器运行状态 - 内存使用:`, process.memoryUsage());
    console.log(`当前存储的消息数量:`, messages.size);
}, 60000); // 每分钟检查一次

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
const server = app.listen(port, '0.0.0.0', () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('服务器详细信息:');
    console.log(`地址: ${host}`);
    console.log(`端口: ${port}`);
    console.log(`完整地址: http://${host === '0.0.0.0' ? '192.168.1.50' : host}:${port}`);
});

// 设置超时时间
server.timeout = 120000; // 2分钟
server.keepAliveTimeout = 60000; // 1分钟 