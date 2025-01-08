// 生成分享链接
async function generateLink() {
    const message = document.getElementById('inputText').value;
    if (!message) {
        alert('请输入消息内容');
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        const link = `${window.location.origin}/view/${data.id}`;
        
        document.getElementById('messageInput').style.display = 'none';
        document.getElementById('shareLink').style.display = 'block';
        document.getElementById('linkText').value = link;
    } catch (error) {
        alert('生成链接失败，请重试');
    }
}

// 检查URL参数是否包含消息ID
window.onload = async function() {
    const path = window.location.pathname;
    const match = path.match(/\/view\/([a-f0-9]+)/);
    
    if (match) {
        const id = match[1];
        try {
            const response = await fetch(`/api/messages?id=${id}`);
            if (!response.ok) {
                throw new Error('消息不存在或已被销毁');
            }
            
            const data = await response.json();
            
            // 显示消息
            document.getElementById('messageInput').style.display = 'none';
            document.getElementById('messageDisplay').style.display = 'block';
            document.getElementById('message').innerText = data.content;
            
            let timeLeft = 5;
            document.getElementById('countdown').innerText = `${timeLeft} 秒后消息将被销毁`;
            
            const countdown = setInterval(() => {
                timeLeft--;
                document.getElementById('countdown').innerText = `${timeLeft} 秒后消息将被销毁`;
                
                if (timeLeft <= 0) {
                    clearInterval(countdown);
                    createExplosion();
                    const messageElement = document.getElementById('message');
                    messageElement.classList.add('exploding');
                    document.getElementById('countdown').style.display = 'none';
                    
                    setTimeout(() => {
                        messageElement.innerText = '消息已被销毁';
                        messageElement.classList.remove('exploding');
                        
                        setTimeout(() => {
                            document.getElementById('messageDisplay').style.display = 'none';
                            document.getElementById('messageInput').style.display = 'block';
                            // 更新URL，移除消息ID
                            history.pushState({}, '', '/');
                        }, 1000);
                    }, 500);
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