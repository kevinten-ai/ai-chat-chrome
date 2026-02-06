// Content Script for AI Chat Chrome Extension
// Injects floating chat UI into web pages

class FloatingChatUI {
  constructor() {
    this.isVisible = false;
    this.isMinimized = false;
    this.messages = [];
    this.typing = false;
    this.config = null;
    this.eventListeners = [];
    this.timers = [];
    this.init();
  }

  async init() {
    // Check if we should load on this page
    if (!this.shouldLoadOnPage()) {
      console.log('AI Chat extension skipped on this page');
      return;
    }

    await this.loadConfig();
    this.createUI();
    this.bindEvents();
    this.injectStyles();
  }

  shouldLoadOnPage() {
    // Skip on Chrome internal pages
    if (location.protocol === 'chrome:' || location.protocol === 'chrome-extension:') {
      return false;
    }

    // Skip on certain domains that might cause issues
    const skipDomains = ['chrome.google.com', 'chromewebstore.google.com'];
    try {
      const currentDomain = new URL(location.href).hostname;
      return !skipDomains.some(domain => currentDomain.includes(domain));
    } catch (e) {
      // If URL parsing fails, allow loading
      return true;
    }
  }

  async loadConfig() {
    try {
      const response = await this.sendMessage('GET_CONFIG');
      if (response.success) {
        this.config = response.data;
      } else {
        console.warn('Failed to load config:', response.error);
        // Use default config
        this.config = {
          aiService: 'openai',
          aiModel: 'gpt-3.5-turbo',
          showNotifications: true
        };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      // Use default config and show error to user
      this.config = {
        aiService: 'openai',
        aiModel: 'gpt-3.5-turbo',
        showNotifications: true
      };
      this.showError('配置加载失败，使用默认设置');
    }
  }

  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'ai-chat-extension-container';
    this.container.innerHTML = `
      <!-- Floating Button -->
      <div id="ai-chat-toggle-btn" class="ai-chat-toggle-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
        </svg>
      </div>

      <!-- Chat Modal -->
      <div id="ai-chat-modal" class="ai-chat-modal">
        <div class="ai-chat-header">
          <div class="ai-chat-title">
            <span class="ai-icon">🤖</span>
            AI助手
          </div>
          <div class="ai-chat-controls">
            <button id="ai-chat-minimize" class="ai-chat-btn" title="最小化">−</button>
            <button id="ai-chat-settings" class="ai-chat-btn" title="设置">⚙️</button>
            <button id="ai-chat-close" class="ai-chat-btn" title="关闭">×</button>
          </div>
        </div>

        <div class="ai-chat-messages" id="ai-chat-messages">
          <div class="ai-welcome-message">
            <div class="ai-message ai-message-assistant">
              <div class="ai-message-avatar">🤖</div>
              <div class="ai-message-content">
                <div class="ai-message-text">你好！我是AI助手，有什么可以帮助你的吗？</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-chat-input-area">
          <div class="ai-chat-input-container">
            <textarea
              id="ai-chat-input"
              class="ai-chat-input"
              placeholder="输入你的问题..."
              rows="1"
              maxlength="2000"
            ></textarea>
            <button id="ai-chat-send" class="ai-chat-send-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div class="ai-chat-footer">
            <span class="ai-chat-status" id="ai-chat-status">就绪</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Get DOM references
    this.toggleBtn = document.getElementById('ai-chat-toggle-btn');
    this.modal = document.getElementById('ai-chat-modal');
    this.messagesContainer = document.getElementById('ai-chat-messages');
    this.input = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('ai-chat-send');
    this.status = document.getElementById('ai-chat-status');
  }

  injectStyles() {
    // Styles are injected via manifest content_scripts CSS
    // Additional dynamic styles can be added here if needed
  }

  bindEvents() {
    // Toggle button
    this.addEventListener(this.toggleBtn, 'click', () => this.toggleChat());

    // Modal controls
    this.addEventListener(document.getElementById('ai-chat-minimize'), 'click', () => this.minimizeChat());
    this.addEventListener(document.getElementById('ai-chat-settings'), 'click', () => this.openSettings());
    this.addEventListener(document.getElementById('ai-chat-close'), 'click', () => this.closeChat());

    // Input handling
    this.addEventListener(this.input, 'input', () => this.handleInput());
    this.addEventListener(this.input, 'keydown', (e) => this.handleKeyDown(e));
    this.addEventListener(this.sendBtn, 'click', () => this.sendMessage());

    // Click outside to close (optional)
    this.addEventListener(document, 'click', (e) => {
      if (!this.container.contains(e.target) && this.isVisible && !this.isMinimized) {
        this.closeChat();
      }
    });
  }

  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  setTimeout(callback, delay) {
    const id = setTimeout(callback, delay);
    this.timers.push(id);
    return id;
  }

  destroy() {
    // Clean up event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Clean up timers
    this.timers.forEach(clearTimeout);
    this.timers = [];

    // Remove from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  toggleChat() {
    if (this.isVisible) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.isVisible = true;
    this.isMinimized = false;
    this.modal.style.display = 'flex';
    this.toggleBtn.style.display = 'none';
    this.input.focus();
    this.updateUI();
  }

  closeChat() {
    this.isVisible = false;
    this.modal.style.display = 'none';
    this.toggleBtn.style.display = 'flex';
    this.updateUI();
  }

  minimizeChat() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.modal.classList.add('minimized');
      document.getElementById('ai-chat-minimize').textContent = '+';
    } else {
      this.modal.classList.remove('minimized');
      document.getElementById('ai-chat-minimize').textContent = '−';
      this.input.focus();
    }
  }

  openSettings() {
    this.sendMessage('OPEN_OPTIONS_PAGE');
  }

  handleInput() {
    const value = this.input.value.trim();
    this.sendBtn.disabled = value.length === 0;

    // Auto-resize textarea
    this.input.style.height = 'auto';
    this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message || this.typing) return;

    // Clear input
    this.input.value = '';
    this.handleInput();

    // Add user message to UI
    this.addMessage('user', message);

    // Disable send button and show loading state
    this.sendBtn.disabled = true;
    this.sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to background script
      const response = await this.sendMessage('AI_CHAT_REQUEST', { message });

      if (response.success) {
        // Hide typing indicator
        this.hideTypingIndicator();

        // Add AI response
        this.addMessage('assistant', response.data.content);

        // Update status
        this.updateStatus('就绪');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('assistant', `抱歉，发生了错误：${error.message}`);
      this.updateStatus('错误');
    } finally {
      // Always restore send button state
      this.sendBtn.disabled = false;
      this.sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/></svg>';
      this.handleInput(); // Re-check if should be disabled based on input
    }
  }

  addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${role}`;

    const avatar = role === 'user' ? '👤' : '🤖';

    messageDiv.innerHTML = `
      <div class="ai-message-avatar">${avatar}</div>
      <div class="ai-message-content">
        <div class="ai-message-text">${this.formatMessage(content)}</div>
        <div class="ai-message-time">${this.formatTime(new Date())}</div>
      </div>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.typing = true;
    this.updateStatus('AI正在思考...');

    const indicator = document.createElement('div');
    indicator.className = 'ai-message ai-message-assistant ai-typing-indicator';
    indicator.id = 'ai-typing-indicator';
    indicator.innerHTML = `
      <div class="ai-message-avatar">🤖</div>
      <div class="ai-message-content">
        <div class="ai-typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.typing = false;
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  updateStatus(text) {
    this.status.textContent = text;
  }

  showError(message) {
    // Show error message in chat
    this.addMessage('assistant', `❌ ${message}`);

    // Update status
    this.updateStatus('错误');

    // Auto-hide status after 5 seconds
    setTimeout(() => {
      this.updateStatus('就绪');
    }, 5000);
  }

  updateUI() {
    // Update toggle button visibility
    this.toggleBtn.style.display = this.isVisible ? 'none' : 'flex';

    // Update modal visibility
    this.modal.style.display = this.isVisible ? 'flex' : 'none';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  formatMessage(text) {
    // Basic markdown-like formatting
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  formatTime(date) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async sendMessage(type, payload = {}, timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Check if extension context is available
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error('扩展上下文不可用，请刷新页面重试'));
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('消息发送超时，请检查扩展是否正常运行'));
      }, timeout);

      chrome.runtime.sendMessage({ type, payload }, response => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success !== false) {
          resolve(response);
        } else {
          reject(new Error(response?.error || '未知错误'));
        }
      });
    });
  }
}

// Message listener for communication with popup and background scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_CHAT') {
    // Open chat UI, optionally with specific session
    const sessionId = message.payload?.sessionId;
    if (sessionId) {
      // TODO: Load specific session if needed
      console.log('Opening chat with session:', sessionId);
    }

    // Ensure UI is initialized and visible
    if (!window.aiChatUI) {
      window.aiChatUI = new FloatingChatUI();
    }
    window.aiChatUI.openChat();
    sendResponse({ success: true });
  } else if (message.type === 'CONFIG_UPDATED') {
    // Handle configuration updates
    console.log('Configuration updated in content script');
    if (window.aiChatUI) {
      // Reload config
      window.aiChatUI.loadConfig().then(() => {
        console.log('Content script config reloaded');
      }).catch(error => {
        console.error('Failed to reload config in content script:', error);
      });
    }
    sendResponse({ success: true });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiChatUI = new FloatingChatUI();
  });
} else {
  window.aiChatUI = new FloatingChatUI();
}

// Handle page navigation (SPA support)
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    // Re-initialize if needed for SPA navigation
    console.log('Page navigation detected, AI chat UI ready');
  }
}).observe(document, { subtree: true, childList: true });
