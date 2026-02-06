// Background Service Worker for AI Chat Chrome Extension
// Handles API calls, message passing, and extension lifecycle

class AIServiceAdapter {
  constructor(config) {
    this.config = config;
  }

  async callAI(messages, options = {}) {
    throw new Error('callAI method must be implemented by subclass');
  }
}

class OpenAIService extends AIServiceAdapter {
  async callAI(messages, options) {
    const { apiKey, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 1024 } = this.config;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model
    };
  }
}

class ClaudeService extends AIServiceAdapter {
  async callAI(messages, options) {
    const { apiKey, model = 'claude-3-sonnet-20240229', temperature = 0.7, maxTokens = 1024 } = this.config;

    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    const requestBody = {
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || '',
      usage: data.usage,
      model: data.model
    };
  }
}

class DeepSeekService extends AIServiceAdapter {
  async callAI(messages, options) {
    const { apiKey, model = 'deepseek-chat', temperature = 0.7, maxTokens = 1024 } = this.config;

    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const requestBody = {
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model
    };
  }
}

class ConfigManager {
  async getConfig() {
    const result = await chrome.storage.sync.get(['aiService', 'aiApiKey', 'aiModel', 'aiTemperature', 'aiMaxTokens', 'showNotifications', 'autoSave']);
    return this.validateConfig({
      aiService: result.aiService || 'openai',
      aiApiKey: result.aiApiKey || '',
      aiModel: result.aiModel || 'gpt-3.5-turbo',
      aiTemperature: result.aiTemperature || 0.7,
      aiMaxTokens: result.aiMaxTokens || 1024,
      showNotifications: result.showNotifications !== false,
      autoSave: result.autoSave !== false
    });
  }

  async setConfig(config) {
    // Validate configuration before saving
    const validatedConfig = this.validateConfig(config);
    await chrome.storage.sync.set(validatedConfig);
  }

  validateConfig(config) {
    const validated = { ...config };

    // Validate AI service
    const validServices = ['openai', 'claude', 'deepseek'];
    if (!validServices.includes(validated.aiService)) {
      validated.aiService = 'openai'; // Default fallback
    }

    // Validate temperature
    if (typeof validated.aiTemperature !== 'number' || validated.aiTemperature < 0 || validated.aiTemperature > 2) {
      validated.aiTemperature = 0.7;
    }

    // Validate max tokens
    const validMaxTokens = [512, 1024, 2048, 4096];
    if (!validMaxTokens.includes(validated.aiMaxTokens)) {
      validated.aiMaxTokens = 1024;
    }

    // Validate boolean fields
    validated.showNotifications = Boolean(validated.showNotifications);
    validated.autoSave = Boolean(validated.autoSave);

    // Ensure API key is a string (but don't log it)
    if (typeof validated.aiApiKey !== 'string') {
      validated.aiApiKey = '';
    }

    return validated;
  }
}

class ChatSessionManager {
  constructor() {
    this.currentSession = null;
    this.messageHistory = [];
  }

  startNewSession() {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      messages: []
    };
    return this.currentSession;
  }

  addMessage(message) {
    if (!this.currentSession) {
      this.startNewSession();
    }
    this.currentSession.messages.push(message);
    this.saveToStorage();
  }

  getCurrentSession() {
    return this.currentSession;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveToStorage() {
    if (this.currentSession) {
      const key = `chat_session_${this.currentSession.id}`;
      await chrome.storage.local.set({ [key]: this.currentSession });
    }
  }

  async loadSession(sessionId) {
    const key = `chat_session_${sessionId}`;
    const result = await chrome.storage.local.get([key]);
    return result[key];
  }

  async getAllSessions() {
    const result = await chrome.storage.local.get(null);
    return Object.keys(result)
      .filter(key => key.startsWith('chat_session_'))
      .map(key => result[key])
      .sort((a, b) => b.startTime - a.startTime);
  }
}

// Simple cache for API responses (to avoid duplicate requests)
class ResponseCache {
  constructor(maxSize = 10, ttl = 300000) { // 5 minutes TTL, max 10 entries
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Global instances
const configManager = new ConfigManager();
const chatSessionManager = new ChatSessionManager();
const responseCache = new ResponseCache();

// AI service factory
function createAIService(config) {
  switch (config.aiService) {
    case 'claude':
      return new ClaudeService(config);
    case 'deepseek':
      return new DeepSeekService(config);
    case 'openai':
    default:
      return new OpenAIService(config);
  }
}

// Error handling with retry and timeout
async function callAIWithRetry(service, messages, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 30000); // 30 second timeout
      });

      const apiCallPromise = service.callAI(messages, options);
      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      return response;
    } catch (error) {
      console.error(`AI API call attempt ${attempt} failed:`, error);

      // Check for specific error types
      if (error.message.includes('API key')) {
        throw new Error('API密钥无效或未设置，请检查设置');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API使用量已达上限，请稍后重试或升级账户');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.message.includes('timeout')) {
        if (attempt === maxRetries) {
          throw error;
        }
      } else if (attempt === maxRetries) {
        throw new Error(`AI服务调用失败: ${error.message}`);
      }

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Message handlers
const messageHandlers = {
  async AI_CHAT_REQUEST(message, sender, sendResponse) {
    // Validate input
    if (!message.payload || !message.payload.message || typeof message.payload.message !== 'string') {
      sendResponse({
        success: false,
        error: '无效的消息内容'
      });
      return;
    }

    if (message.payload.message.trim().length === 0) {
      sendResponse({
        success: false,
        error: '消息内容不能为空'
      });
      return;
    }

    if (message.payload.message.length > 10000) {
      sendResponse({
        success: false,
        error: '消息内容过长，请控制在10000字符以内'
      });
      return;
    }
    try {
      const config = await configManager.getConfig();

      if (!config.aiApiKey) {
        throw new Error('请先在设置中配置AI API密钥');
      }

      const aiService = createAIService(config);

      // Add user message to session
      chatSessionManager.addMessage({
        role: 'user',
        content: message.payload.message,
        timestamp: Date.now()
      });

      const currentSession = chatSessionManager.getCurrentSession();
      const messages = currentSession.messages;

      // Call AI service
      const response = await callAIWithRetry(aiService, messages, config);

      // Add AI response to session
      chatSessionManager.addMessage({
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        model: response.model,
        usage: response.usage
      });

      sendResponse({
        success: true,
        data: {
          content: response.content,
          sessionId: currentSession.id,
          usage: response.usage
        }
      });

    } catch (error) {
      console.error('AI chat request failed:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  },

  async GET_CONFIG(message, sender, sendResponse) {
    try {
      const config = await configManager.getConfig();
      // Don't send API key to content script for security
      // Only send safe configuration data
      const safeConfig = {
        aiService: config.aiService,
        aiModel: config.aiModel,
        aiTemperature: config.aiTemperature,
        aiMaxTokens: config.aiMaxTokens,
        showNotifications: config.showNotifications,
        autoSave: config.autoSave
      };
      sendResponse({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  },

  async SET_CONFIG(message, sender, sendResponse) {
    try {
      await configManager.setConfig(message.payload);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  },

  async OPEN_OPTIONS_PAGE(message, sender, sendResponse) {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  },

  async GET_CHAT_HISTORY(message, sender, sendResponse) {
    try {
      const sessions = await chatSessionManager.getAllSessions();
      sendResponse({
        success: true,
        data: sessions
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  },

  async CLEAR_CHAT_HISTORY(message, sender, sendResponse) {
    try {
      const sessions = await chatSessionManager.getAllSessions();
      const keysToRemove = sessions.map(session => `chat_session_${session.id}`);
      await chrome.storage.local.remove(keysToRemove);
      chatSessionManager.currentSession = null;
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
};

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];

  if (handler) {
    handler(message, sender, sendResponse);
    return true; // Keep message channel open for async response
  } else {
    sendResponse({
      success: false,
      error: `未知消息类型: ${message.type}`
    });
  }
});

// Configuration update listener for cross-context sync
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONFIG_UPDATED') {
    console.log('Configuration updated:', message.data);
    // Update cached config if needed
    // This ensures all contexts have the latest config
    sendResponse({ success: true });
    return true;
  }
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI Chat Extension installed');
    // Open options page for initial setup
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
  } else if (details.reason === 'update') {
    console.log('AI Chat Extension updated');
  }
});

// Handle extension icon click (open popup is handled by manifest)
chrome.action.onClicked.addListener(async (tab) => {
  // This will be handled by the popup defined in manifest
  console.log('Extension icon clicked');
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIServiceAdapter,
    OpenAIService,
    ClaudeService,
    DeepSeekService,
    ConfigManager,
    ChatSessionManager,
    createAIService,
    callAIWithRetry
  };
}
