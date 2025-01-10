// 获取 baseUrl 的辅助函数
function getBaseUrl() {
    const isLocalhost = ['localhost', '127.0.0.1', '192.168.1.50'].includes(window.location.hostname);
    return isLocalhost ? `http://${window.location.hostname}:3000` : '';
}

// 显示 toast 提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 生成分享链接
async function generateLink() {
    try {
        console.log('开始生成链接...');
        const message = document.getElementById('inputText').value;
        if (!message) {
            showToast('请输入消息内容');
            return;
        }
        
        // 确保总是获取当前选中的效果
        const effect = getSelectedEffect();
        if (!effect) {
            showToast('请选择一个消失效果');
            return;
        }

        const baseUrl = getBaseUrl();
        console.log('准备发送请求:', {
            url: `${baseUrl}/api/messages`,
            message: message.length + ' 字符',
            effect
        });
        
        const response = await fetch(`${baseUrl}/api/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message, effect })
        });
        
        console.log('收到响应:', {
            status: response.status,
            statusText: response.statusText
        });

        const data = await response.json();
        console.log('解析响应数据:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        if (!data.id) {
            throw new Error('服务器返回的数据无效');
        }
        
        const link = `${baseUrl}/view/${data.id}`;
        console.log('生成链接成功:', link);
        
        document.getElementById('messageInput').style.display = 'none';
        document.getElementById('shareLink').style.display = 'block';
        document.getElementById('linkText').value = link;
    } catch (error) {
        console.error('生成链接时发生错误:', error);
        showToast(error.message || '生成链接失败，请确保后端服务正在运行');
        // 发生错误时保持输入界面可见
        document.getElementById('messageInput').style.display = 'block';
        document.getElementById('shareLink').style.display = 'none';
    }
}

// 应用特效的统一函数
function applyEffect(element, effect, isDestroy = false) {
    element.className = '';
    
    switch (effect) {
        case 'explosion':
            const container = document.querySelector('.container');
            createExplosion(container, element);
            break;
            
        case 'dissolve':
        case 'evaporate':
            const isEvaporate = effect === 'evaporate';
            const duration = isEvaporate ? 1.5 : 0.8;
            const originalHTML = element.innerHTML;
            const lines = element.innerText.split('\n');
            element.innerHTML = '';
            
            lines.forEach((line, lineIndex) => {
                const lineDiv = document.createElement('div');
                Object.assign(lineDiv.style, {
                    position: 'relative',
                    lineHeight: '1.15',
                    fontSize: isDestroy ? '3em' : '1em',
                    fontWeight: '700',
                    fontFamily: "'Noto Serif SC', serif",
                    marginBottom: lineIndex < lines.length - 1 ? '10px' : '0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                });
                
                line.split('').forEach((char, index) => {
                    const span = document.createElement('span');
                    span.innerText = char;
                    span.style.display = 'inline-block';
                    span.style.transition = `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
                    span.style.transitionDelay = `${index * 0.02}s`;
                    
                    requestAnimationFrame(() => {
                        if (isEvaporate) {
                            const rotate = -25 + Math.random() * 50;
                            const skewX = -30 + Math.random() * 80;
                            const skewY = -30 + Math.random() * 60;
                            span.style.transform = `translateY(-300px) rotate(${rotate}deg) skew(${skewX}deg, ${skewY}deg)`;
                        } else {
                            const fallDirection = Math.random() > 0.5 ? 1 : -1;
                            const rotation = (Math.random() * 30 + 15) * fallDirection;
                            const fallDistance = 100 + Math.random() * 100;
                            span.style.transform = `translateY(${fallDistance}px) rotate(${rotation}deg)`;
                        }
                        span.style.opacity = '0';
                        span.style.filter = `blur(${isEvaporate ? 12 : 5}px)`;
                    });
                    
                    lineDiv.appendChild(span);
                });
                element.appendChild(lineDiv);
            });
            
            if (isDestroy) {
                setTimeout(() => {
                    element.style.display = 'none';
                }, duration * 1000);
            } else {
                setTimeout(() => {
                    element.innerHTML = originalHTML;
                    element.style.opacity = '1';
                    element.style.transform = 'none';
                    element.style.filter = 'none';
                }, duration * 1000);
            }
            break;
    }
}

// 复制链接功能
function copyLink() {
    const linkText = document.getElementById('linkText');
    if (!linkText) {
        showToast('复制功能出错');
        return;
    }
    
    try {
        // 选中文本
        linkText.select();
        linkText.setSelectionRange(0, 99999); // 兼容移动设备
        
        // 执行复制
        document.execCommand('copy');
        
        // 取消选中
        window.getSelection().removeAllRanges();
        
        showToast('链接已复制到剪贴板');
    } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制链接');
        // 选中文本，方便用户手动复制
        linkText.select();
    }
}

function toggleEffectOptions() {
    const header = document.querySelector('.effect-preview-header');
    const options = document.querySelector('.effect-options');
    header.classList.toggle('collapsed');
    options.classList.toggle('collapsed');
}

function getSelectedEffect() {
    const selectedRadio = document.querySelector('input[name="destroyEffect"]:checked');
    return selectedRadio ? selectedRadio.value : null;
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    const effectOptions = document.querySelectorAll('.effect-option');
    const titleElement = document.querySelector('h1');
    
    // 默认选中第一个效果
    if (effectOptions.length > 0) {
        const firstOption = effectOptions[0];
        const firstRadio = firstOption.querySelector('input[type="radio"]');
        firstOption.classList.add('selected');
        firstRadio.checked = true;
    }
    
    effectOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        
        option.addEventListener('mouseenter', () => {
            if (radio.value) {
                applyEffect(titleElement, radio.value);
            }
        });
        
        option.addEventListener('mouseleave', () => {
            titleElement.innerHTML = '阅后即焚';
            titleElement.className = '';
            titleElement.style.cssText = '';
        });
        
        option.addEventListener('click', () => {
            effectOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            radio.checked = true;
        });
    });
});

// 创建爆炸效果的函数
function createExplosion(container, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 创建粒子
    const particles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置和角度
        const angle = (Math.random() * 360) * Math.PI / 180;
        const velocity = 1 + Math.random() * 5;
        const size = Math.random() * 5 + 2;
        
        Object.assign(particle.style, {
            position: 'fixed',
            left: centerX + 'px',
            top: centerY + 'px',
            width: size + 'px',
            height: size + 'px',
            backgroundColor: '#000',
            borderRadius: '50%',
            pointerEvents: 'none'
        });
        
        particles.push({
            element: particle,
            angle,
            velocity,
            opacity: 1,
            x: centerX,
            y: centerY
        });
        
        container.appendChild(particle);
    }
    
    // 隐藏原始元素
    element.style.opacity = '0';
    
    // 动画循环
    let frame = 0;
    const animate = () => {
        frame++;
        let allDone = true;
        
        particles.forEach(particle => {
            if (particle.opacity <= 0) return;
            
            allDone = false;
            particle.x += Math.cos(particle.angle) * particle.velocity;
            particle.y += Math.sin(particle.angle) * particle.velocity;
            particle.opacity -= 0.02;
            
            particle.element.style.transform = `translate(${particle.x - centerX}px, ${particle.y - centerY}px)`;
            particle.element.style.opacity = particle.opacity;
        });
        
        if (!allDone && frame < 120) {
            requestAnimationFrame(animate);
        } else {
            // 清理粒子
            particles.forEach(particle => particle.element.remove());
            element.style.display = 'none';
        }
    };
    
    requestAnimationFrame(animate);
}

// 页面加载处理
window.onload = async function() {
    const match = window.location.pathname.match(/\/view\/([a-zA-Z0-9-_]+)/);
    if (!match) return;
    
    try {
        console.log('检测到消息ID:', match[1]);
        const messageId = match[1];
        const baseUrl = getBaseUrl();
        
        // 隐藏所有不需要的元素
        const h1 = document.querySelector('h1');
        const tagline = document.querySelector('.tagline');
        const features = document.querySelector('.features');
        h1.style.display = 'none';
        tagline.style.display = 'none';
        features.style.display = 'none';
        document.getElementById('messageInput').style.display = 'none';
        document.getElementById('shareLink').style.display = 'none';
        document.getElementById('messageDisplay').style.display = 'block';
        
        console.log('正在获取消息...');
        const response = await fetch(`${baseUrl}/api/messages?id=${messageId}`);
        console.log('获取消息响应:', response.status);
        
        if (!response.ok) {
            throw new Error('消息不存在或已被销毁');
        }
        
        const data = await response.json();
        console.log('消息获取成功，准备显示');
        
        // 显示消息
        const messageElement = document.getElementById('message');
        messageElement.textContent = data.content;
        messageElement.style.fontFamily = "'Noto Serif SC', serif";
        messageElement.style.fontSize = '3em';
        messageElement.style.fontWeight = '700';
        messageElement.style.lineHeight = '1.4';
        messageElement.style.color = '#000';
        
        // 开始倒计时
        let countdown = 3;
        const countdownElement = document.getElementById('countdown');
        countdownElement.textContent = `消息将在 ${countdown} 秒后销毁`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownElement.textContent = `消息将在 ${countdown} 秒后销毁`;
            } else {
                clearInterval(timer);
                
                // 应用销毁效果
                const effect = data.effect || 'explosion';
                console.log('应用销毁效果:', effect);
                const container = document.querySelector('.container');
                
                if (effect === 'explosion') {
                    createExplosion(container, messageElement);
                } else {
                    applyEffect(messageElement, effect, true);
                }
                
                // 使用 H1 样式显示"消息已销毁"
                setTimeout(() => {
                    messageElement.style.display = 'none';
                    countdownElement.style.fontFamily = "'Noto Serif SC', serif";
                    countdownElement.style.fontSize = '3em';
                    countdownElement.style.fontWeight = '700';
                    countdownElement.style.lineHeight = '1.4';
                    countdownElement.style.color = '#000';
                    countdownElement.style.textAlign = 'center';
                    countdownElement.style.margin = '20px 0';
                    countdownElement.textContent = '消息已销毁';
                    
                    // 300ms后显示主页面
                    setTimeout(() => {
                        // 显示所有主页元素
                        h1.style.display = 'flex';
                        tagline.style.display = 'block';
                        features.style.display = 'flex';
                        document.getElementById('messageInput').style.display = 'block';
                        document.getElementById('messageDisplay').style.display = 'none';
                        
                        // 清空输入框
                        document.getElementById('inputText').value = '';
                        
                        // 更新 URL，移除消息 ID
                        window.history.pushState({}, '', baseUrl);
                    }, 300);
                }, 800); // 等待溶解效果完成
            }
        }, 1000);
        
    } catch (error) {
        console.error('获取消息失败:', error);
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.style.display = 'block';
        
        // 使用 H1 样式显示错误消息
        messageDisplay.innerHTML = `<div class="error-message" style="font-family: 'Noto Serif SC', serif; font-size: 3em; font-weight: 700; line-height: 1.4; color: #000; text-align: center; margin: 20px 0;">消息不存在或已被销毁</div>`;
        
        // 1秒后显示主页面
        setTimeout(() => {
            // 显示所有主页元素
            document.querySelector('h1').style.display = 'flex';
            document.querySelector('.tagline').style.display = 'block';
            document.querySelector('.features').style.display = 'flex';
            document.getElementById('messageInput').style.display = 'block';
            document.getElementById('messageDisplay').style.display = 'none';
            
            // 更新 URL，移除消息 ID
            window.history.pushState({}, '', getBaseUrl());
        }, 1000);
    }
}; 