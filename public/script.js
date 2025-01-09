// 生成分享链接
async function generateLink() {
    const message = document.getElementById('inputText').value;
    if (!message) {
        alert('请输入消息内容');
        return;
    }
    
    try {
        const effect = getSelectedEffect();
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
            body: JSON.stringify({ 
                message,
                effect 
            })
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
                    countdownElement.style.display = 'none';
                    
                    // 应用销毁效果
                    applyDestroyEffect(messageElement, data.effect || 'explosion');
                    
                    // 等待动画完成后显示销毁信息
                    setTimeout(() => {
                        messageElement.innerText = '消息已被销毁';
                        messageElement.className = ''; // 移除所有动画类
                        
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
function createExplosion(container, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // 计算相对于容器的中心点
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2 - 20; // 稍微往上一点
    
    // 创建更多粒子
    for (let i = 0; i < 150; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机大小，增加粒子尺寸
        const size = Math.random() * 6 + 4; // 4-12px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 使用纯黑色
        particle.style.color = '#000';
        
        // 初始位置（相对于容器）
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        
        container.appendChild(particle);
        
        // 烟花效果的运动轨迹
        const angle = (Math.random() * Math.PI * 2);
        const velocity = Math.random() * 400 + 100; // 调整速度范围
        const gravity = 0; // 减小重力效果，让粒子飞得更远
        
        // 使用更简单但更有效的动画
        const animation = particle.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * velocity * 0.5}px, ${Math.sin(angle) * velocity * 0.5 + gravity * 0.15}px) scale(0.8)`,
                opacity: 0.8
            },
            {
                transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + gravity}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 1200 + Math.random() * 800, // 延长动画时间
            easing: 'cubic-bezier(0.15, 0.85, 0.45, 0.95)',
            fill: 'both'
        });
        
        animation.onfinish = () => {
            particle.remove();
        };
    }
    
    // 立即隐藏目标元素
    targetElement.style.opacity = '0';
    targetElement.style.transform = 'scale(0.8)';
}

// 初始化效果选择器
document.addEventListener('DOMContentLoaded', function() {
    const effectOptions = document.querySelectorAll('.effect-option');
    const titleElement = document.querySelector('h1');
    
    effectOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        
        // 初始化选中状态
        if (radio.checked) {
            option.classList.add('selected');
        }
        
        // 悬停预览效果
        option.addEventListener('mouseenter', () => {
            console.log('鼠标悬停，应用效果:', radio.value);
            applyEffect(titleElement, radio.value);
        });
        
        // 鼠标离开时恢复原状
        option.addEventListener('mouseleave', () => {
            console.log('鼠标离开，恢复原状');
            titleElement.className = '';
            titleElement.style.opacity = '1';
            titleElement.style.transform = 'none';
            titleElement.style.filter = 'none';
        });
        
        // 点击整个选项时选中单选框
        option.addEventListener('click', () => {
            effectOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            radio.checked = true;
            console.log('选择效果:', radio.value);
        });
    });
});

// 应用效果
function applyEffect(element, effect) {
    console.log('应用效果:', effect, '到元素:', element);
    element.className = '';
    
    switch (effect) {
        case 'explosion':
            console.log('创建爆炸效果');
            const container = document.querySelector('.container');
            console.log('容器:', container);
            createExplosion(container, element);
            break;
        case 'dissolve':
            element.style.transition = 'all 0.5s ease-out';
            element.style.opacity = '0.5';
            element.style.filter = 'blur(3px)';
            break;
        case 'evaporate':
            element.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.transform = 'translateY(-150px) rotate(10deg) skew(-15deg, 15deg) scale(0.9)';
            element.style.opacity = '0';
            element.style.filter = 'blur(8px)';
            break;
    }
}

// 获取选中的效果
function getSelectedEffect() {
    const selectedRadio = document.querySelector('input[name="destroyEffect"]:checked');
    return selectedRadio ? selectedRadio.value : 'explosion';
}

// 应用销毁效果
function applyDestroyEffect(messageElement, effect) {
    console.log('应用销毁效果:', effect);
    switch (effect) {
        case 'explosion':
            const container = document.querySelector('.container');
            console.log('销毁容器:', container);
            createExplosion(container, messageElement);
            break;
        case 'dissolve':
            messageElement.style.transition = 'all 1s ease-out';
            messageElement.style.opacity = '0';
            messageElement.style.filter = 'blur(10px)';
            break;
        case 'evaporate':
            messageElement.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            messageElement.style.transform = 'translateY(-300px) rotate(20deg) skew(-20deg, 20deg) scale(0.8)';
            messageElement.style.opacity = '0';
            messageElement.style.filter = 'blur(12px)';
            break;
    }
} 