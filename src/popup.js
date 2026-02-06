// Popup page for AI Chat Chrome Extension

class PopupManager {
  constructor() {
    this.config = {};
    this.recentChats = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.updateUI();
  }

  async loadData() {
    try {
      // Load configuration
      const configResponse = await this.sendMessage('GET_CONFIG');
      if (configResponse.success) {
        this.config = configResponse.data;
      }

      // Load recent chats
      const chatsResponse = await this.sendMessage('GET_CHAT_HISTORY');
      if (chatsResponse.success) {
        this.recentChats = chatsResponse.data.slice(0, 5); // Show only 5 most recent
      }

      // Check API status
      await this.checkApiStatus();
    } catch (error) {
      console.error('Failed to load popup data:', error);
      this.updateApiStatus('error', '加载失败');
    }
  }

  async checkApiStatus() {
    try {
      if (!this.config.aiApiKey) {
        this.updateApiStatus('warning', '未配置API密钥');
        return;
      }

      // Simple API connectivity test (this could be more sophisticated)
      this.updateApiStatus('ready', '已配置');
    } catch (error) {
      this.updateApiStatus('error', '配置错误');
    }
  }

  bindEvents() {
    // Action buttons
    document.getElementById('open-chat').addEventListener('click', () => this.openChat());
    document.getElementById('open-options').addEventListener('click', () => this.openOptions());
    document.getElementById('new-chat').addEventListener('click', () => this.newChat());

    // Footer links
    document.getElementById('open-github').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/your-repo' });
    });

    document.getElementById('open-docs').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
    });

    // Chat list clicks
    document.getElementById('chat-list').addEventListener('click', (e) => {
      const chatItem = e.target.closest('.chat-item');
      if (chatItem) {
        const sessionId = chatItem.dataset.sessionId;
        this.openChat(sessionId);
      }
    });
  }

  async openChat(sessionId = null) {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        console.error('No active tab found');
        return;
      }

      // Inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content.js']
        });
      } catch (error) {
        // Content script might already be injected, continue
        console.log('Content script injection skipped:', error.message);
      }

      // Send message to content script to open chat
      await chrome.tabs.sendMessage(tab.id, {
        type: 'OPEN_CHAT',
        payload: { sessionId }
      });

      // Close popup
      window.close();
    } catch (error) {
      console.error('Failed to open chat:', error);
      // Fallback: just close popup and let user manually trigger
      window.close();
    }
  }

  async openOptions() {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
      window.close();
    } catch (error) {
      console.error('Failed to open options:', error);
    }
  }

  async newChat() {
    // Open chat with new session
    await this.openChat();
  }

  updateUI() {
    this.updateStatusSection();
    this.updateChatList();
  }

  updateStatusSection() {
    // Update API status
    const apiStatusDot = document.getElementById('api-status-dot');
    const apiStatusText = document.getElementById('api-status');

    // API status is updated in checkApiStatus method

    // Update current model
    const modelName = this.getModelDisplayName(this.config.aiModel);
    document.getElementById('current-model').textContent = modelName;

    // Update chat count
    document.getElementById('chat-count').textContent = this.recentChats.length;
  }

  updateApiStatus(status, message) {
    const dot = document.getElementById('api-status-dot');
    const text = document.getElementById('api-status');

    dot.className = 'status-dot';
    dot.classList.add(status);
    text.textContent = message;
  }

  updateChatList() {
    const chatList = document.getElementById('chat-list');
    const noChats = document.getElementById('no-chats');

    if (this.recentChats.length === 0) {
      noChats.classList.remove('hidden');
      return;
    }

    noChats.classList.add('hidden');

    const chatItems = this.recentChats.map(chat => {
      const date = new Date(chat.startTime);
      const timeString = this.formatTime(date);
      const previewText = this.getChatPreview(chat);

      return `
        <div class="chat-item" data-session-id="${chat.id}">
          <div class="chat-time">${timeString}</div>
          <div class="chat-preview">${previewText}</div>
        </div>
      `;
    }).join('');

    chatList.innerHTML = chatItems;
  }

  getModelDisplayName(modelId) {
    if (!modelId) return '-';

    const modelNames = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-coder': 'DeepSeek Coder'
    };

    return modelNames[modelId] || modelId;
  }

  getChatPreview(chat) {
    if (!chat.messages || chat.messages.length === 0) {
      return '空对话';
    }

    // Get the first user message
    const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 50
        ? firstUserMessage.content.substring(0, 50) + '...'
        : firstUserMessage.content;
    }

    // Fallback to first message of any type
    const firstMessage = chat.messages[0];
    return firstMessage.content.length > 50
      ? firstMessage.content.substring(0, 50) + '...'
      : firstMessage.content;
  }

  formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}小时前`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  async sendMessage(type, payload = {}, timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('消息发送超时，请刷新页面重试'));
      }, timeout);

      chrome.runtime.sendMessage({ type, payload }, response => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
