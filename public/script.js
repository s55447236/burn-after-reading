// 生成分享链接
async function generateLink() {
    const message = document.getElementById('inputText').value;
    if (!message) {
        alert('请输入消息内容');
        return;
    }
    
    try {
        // 使用完整的 API URL
        const baseUrl = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '192.168.1.50'
            ? 'http://192.168.1.50:3000'
            : '';
            
        const response = await fetch(`${baseUrl}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const link = `${baseUrl}/view/${data.id}`;
        
        document.getElementById('messageInput').style.display = 'none';
        document.getElementById('shareLink').style.display = 'block';
        document.getElementById('linkText').value = link;
    } catch (error) {
        console.error('生成链接失败:', error);
        alert('生成链接失败，请确保后端服务正在运行。错误详情：' + error.message);
    }
}

// 检查URL参数是否包含消息ID
window.onload = async function() {
    const path = window.location.pathname;
    const match = path.match(/\/view\/([a-zA-Z0-9]+)/);
    
    if (match) {
        const id = match[1];
        try {
            // 使用完整的 API URL
            const baseUrl = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '192.168.1.50'
                ? 'http://192.168.1.50:3000'
                : '';
                
            const response = await fetch(`${baseUrl}/api/messages?id=${id}`);
            if (!response.ok) {
                throw new Error('消息不存在或已被销毁');
            }
            
            const data = await response.json();
            
            // 显示消息
            document.getElementById('messageInput').style.display = 'none';
            document.getElementById('messageDisplay').style.display = 'block';
            const messageElement = document.getElementById('message');
            messageElement.innerText = data.content;
            
            // 根据内容长度计算显示时间（2-5秒）
            const messageLength = data.content.length;
            const maxLength = 200; // 最大字符数
            let timeLeft = Math.max(2, Math.min(5, Math.ceil(messageLength / maxLength * 5)));
            
            // 显示倒计时
            const countdownElement = document.getElementById('countdown');
            countdownElement.style.display = 'block';
            countdownElement.innerText = `${timeLeft} 秒后消息将被销毁`;
            
            // 开始倒计时
            const countdown = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    countdownElement.innerText = `${timeLeft} 秒后消息将被销毁`;
                } else {
                    clearInterval(countdown);
                    
                    // 显示销毁动画
                    createExplosion();
                    messageElement.classList.add('exploding');
                    countdownElement.style.display = 'none';
                    
                    // 等待动画完成（1秒）后显示销毁信息
                    setTimeout(() => {
                        messageElement.innerText = '消息已被销毁';
                        messageElement.classList.remove('exploding');
                        
                        // 显示销毁信息 1 秒后返回输入界面
                        setTimeout(() => {
                            document.getElementById('messageDisplay').style.display = 'none';
                            document.getElementById('messageInput').style.display = 'block';
                            history.pushState({}, '', '/');
                        }, 1000);
                    }, 1000);
                }
            }, 1000);
        } catch (error) {
            alert(error.message);
            document.getElementById('messageInput').style.display = 'block';
        }
    }
};

// 复制链接
function copyLink() {
    const linkText = document.getElementById('linkText');
    linkText.select();
    document.execCommand('copy');
    alert('链接已复制到剪贴板');
}

// 添加爆炸效果函数
function createExplosion() {
    const messageElement = document.getElementById('message');
    const rect = messageElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 创建粒子
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机大小
        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 初始位置
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        
        document.body.appendChild(particle);
        
        // 随机方向和距离
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        // 动画
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
} 