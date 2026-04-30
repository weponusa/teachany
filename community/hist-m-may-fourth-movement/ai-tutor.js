// AI Tutor Module
const aiTutor = {
  messages: [],
  isOpen: false,
  
  init() {
    // Add toggle button if not exists
    if (!document.getElementById('aiTutorToggle')) {
      const toggle = document.createElement('button');
      toggle.id = 'aiTutorToggle';
      toggle.className = 'ai-tutor-toggle';
      toggle.textContent = '🤖 AI 助教';
      toggle.onclick = () => this.toggle();
      document.body.appendChild(toggle);
    }
    
    // Add container if not exists
    if (!document.getElementById('aiTutorContainer')) {
      const container = document.createElement('div');
      container.id = 'aiTutorContainer';
      container.className = 'ai-tutor-container';
      container.innerHTML = `
        <div class="ai-tutor-header">
          <div class="ai-tutor-avatar">🤖</div>
          <div>
            <div class="ai-tutor-name">AI 助教</div>
            <div class="ai-tutor-status online">在线</div>
          </div>
        </div>
        <div class="ai-tutor-messages" id="aiTutorMessages"></div>
        <div class="ai-tutor-input-area">
          <input type="text" class="ai-tutor-input" id="aiTutorInput" placeholder="输入问题...">
          <button class="ai-tutor-send" onclick="aiTutor.sendMessage()">发送</button>
        </div>
      `;
      document.body.appendChild(container);
      
      // Setup input event
      document.getElementById('aiTutorInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') aiTutor.sendMessage();
      });
    }
  },
  
  toggle() {
    this.isOpen = !this.isOpen;
    document.getElementById('aiTutorContainer').style.display = this.isOpen ? 'block' : 'none';
    document.getElementById('aiTutorToggle').style.background = this.isOpen ? 'var(--primary)' : 'var(--bg-card)';
    
    if (this.isOpen) {
      // Add welcome message
      this.addMessage('assistant', '你好！我是 AI 助教，可以帮助你理解五四运动的相关知识。有什么问题尽管问我！');
    }
  },
  
  addMessage(role, content) {
    const messagesDiv = document.getElementById('aiTutorMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-tutor-message ${role}`;
    messageDiv.textContent = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    this.messages.push({ role, content });
  },
  
  sendMessage() {
    const input = document.getElementById('aiTutorInput');
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Simulate AI response (in real scenario, this would call an API)
    setTimeout(() => {
      const responses = {
        '背景': '巴黎和会中国外交失败的主要原因有三个：1. 帝国主义国家重新瓜分世界的野心未改；2. 北洋政府腐败无能，对列强抱有幻想；3. 中国综合国力衰败，在国际上没有话语权。',
        '口号': '五四运动的核心口号是"外争主权，内除国贼"、"还我青岛"、"拒绝和约签字"等。',
        '意义': '五四运动是一次彻底的反帝反封建的爱国运动，标志着中国新民主主义革命的开端。五四精神的核心是爱国主义，具体表现为民主与科学的精神、追求真理的精神。',
        '工人': '6月以后，运动重心从北京转移到上海，工人阶级成为运动主力。上海工人罢工，商人罢市，运动进入高潮。',
        '结果': '北洋政府被迫释放被捕学生，罢免曹汝霖、陆宗舆、章宗祥三人职务，中国代表团拒绝在巴黎和约上签字。',
        '五四精神': '五四精神的核心是爱国主义，具体表现为民主与科学的精神、追求真理的精神、勇于探索的精神。',
      };
      
      // Find matching response or give generic response
      let response = responses[message] || `关于"${message}"，我可以帮你查找相关资料。请问你想了解哪个方面？`;
      this.addMessage('assistant', response);
    }, 1000);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  aiTutor.init();
});
