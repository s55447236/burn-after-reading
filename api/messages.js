let messages = new Map();

// 清理过期消息
setInterval(() => {
    const now = Date.now();
    for (const [id, msg] of messages) {
        if (now - msg.createdAt > 5 * 60 * 1000) {
            messages.delete(id);
        }
    }
}, 60000);

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 处理POST请求 - 创建新消息
    if (req.method === 'POST') {
        const { message } = req.body;
        const id = Math.random().toString(36).substr(2, 8);
        
        messages.set(id, {
            content: message,
            createdAt: Date.now()
        });

        return res.json({ id });
    }

    // 处理GET请求 - 获取消息
    if (req.method === 'GET') {
        const id = req.query.id;
        const message = messages.get(id);

        if (!message) {
            return res.status(404).json({ error: '消息不存在或已被销毁' });
        }

        messages.delete(id);
        return res.json({ content: message.content });
    }

    return res.status(405).json({ error: '方法不允许' });
} 