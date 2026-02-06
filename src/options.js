// Options page for AI Chat Chrome Extension

class OptionsManager {
  constructor() {
    this.currentConfig = {};
    this.modelConfigs = {
      openai: [
        { id: 'gpt-4', name: 'GPT-4', desc: '最强大的模型，复杂任务首选' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: '快速且强大的GPT-4版本' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: '快速且经济实惠的选择' }
      ],
      claude: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: '最强大的Claude模型' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', desc: '平衡性能和速度' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', desc: '快速且轻量级' }
      ],
      deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', desc: 'DeepSeek对话模型' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', desc: '专为代码生成优化' }
      ]
    };

    this.init();
  }

  async init() {
    await this.loadCurrentConfig();
    this.bindEvents();
    this.setupTabs();
    this.updateModelGrid();
    this.updateUI();
    this.updateApiKeyLink();
  }

  async loadCurrentConfig() {
    try {
      const response = await this.sendMessage('GET_CONFIG');
      if (response.success) {
        this.currentConfig = response.data;
      } else {
        // Use defaults if config loading fails
        this.currentConfig = {
          aiService: 'openai',
          aiModel: 'gpt-3.5-turbo',
          aiTemperature: 0.7,
          aiMaxTokens: 1024,
          showNotifications: true,
          autoSave: true
        };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.showStatus('加载配置失败，请刷新页面重试', 'error');
    }
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // AI service change
    document.getElementById('ai-service').addEventListener('change', (e) => {
      this.currentConfig.aiService = e.target.value;
      this.updateModelGrid();
      this.updateApiKeyLink();
    });

    // API key toggle
    document.getElementById('toggle-api-key').addEventListener('click', () => {
      this.toggleApiKeyVisibility();
    });

    // Temperature slider
    document.getElementById('ai-temperature').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.currentConfig.aiTemperature = value;
      document.getElementById('temperature-value').textContent = value.toFixed(1);
    });

    // Model selection
    document.getElementById('model-grid').addEventListener('click', (e) => {
      const modelOption = e.target.closest('.model-option');
      if (modelOption) {
        const modelId = modelOption.dataset.modelId;
        this.selectModel(modelId);
      }
    });

    // Settings toggles
    document.getElementById('show-notifications').addEventListener('change', (e) => {
      this.currentConfig.showNotifications = e.target.checked;
    });

    document.getElementById('auto-save').addEventListener('change', (e) => {
      this.currentConfig.autoSave = e.target.checked;
    });

    // Buttons
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
    document.getElementById('export-settings').addEventListener('click', () => this.exportSettings());
    document.getElementById('import-settings').addEventListener('click', () => this.importSettings());
    document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());

    // Max tokens change
    document.getElementById('ai-max-tokens').addEventListener('change', (e) => {
      this.currentConfig.aiMaxTokens = parseInt(e.target.value);
    });
  }

  setupTabs() {
    // Initially show first tab
    this.switchTab('ai-assistant');
  }

  switchTab(tabName) {
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab panel
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Add active class to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  }

  updateModelGrid() {
    const service = this.currentConfig.aiService;
    const models = this.modelConfigs[service] || [];
    const modelGrid = document.getElementById('model-grid');

    modelGrid.innerHTML = models.map(model => `
      <div class="model-option ${this.currentConfig.aiModel === model.id ? 'selected' : ''}"
           data-model-id="${model.id}">
        <div class="model-name">${model.name}</div>
        <div class="model-desc">${model.desc}</div>
      </div>
    `).join('');
  }

  selectModel(modelId) {
    this.currentConfig.aiModel = modelId;
    this.updateModelGrid();
  }

  updateUI() {
    // Update form values
    document.getElementById('ai-service').value = this.currentConfig.aiService || 'openai';
    document.getElementById('ai-api-key').value = this.currentConfig.aiApiKey || '';
    document.getElementById('ai-temperature').value = this.currentConfig.aiTemperature || 0.7;
    document.getElementById('temperature-value').textContent = (this.currentConfig.aiTemperature || 0.7).toFixed(1);
    document.getElementById('ai-max-tokens').value = this.currentConfig.aiMaxTokens || 1024;
    document.getElementById('show-notifications').checked = this.currentConfig.showNotifications !== false;
    document.getElementById('auto-save').checked = this.currentConfig.autoSave !== false;
  }

  updateApiKeyLink() {
    const link = document.getElementById('get-api-key-link');
    const service = this.currentConfig.aiService;

    const links = {
      openai: 'https://platform.openai.com/api-keys',
      claude: 'https://console.anthropic.com/',
      deepseek: 'https://platform.deepseek.com/api_keys'
    };

    link.href = links[service] || '#';
    link.textContent = `获取${service === 'openai' ? 'OpenAI' : service === 'claude' ? 'Claude' : 'DeepSeek'} API密钥`;
  }

  toggleApiKeyVisibility() {
    const input = document.getElementById('ai-api-key');
    const button = document.getElementById('toggle-api-key');

    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '隐藏';
    } else {
      input.type = 'password';
      button.textContent = '显示';
    }
  }

  async saveSettings() {
    const saveBtn = document.getElementById('save-settings');
    const originalText = saveBtn.textContent;

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中...';

      // Get current form values
      const config = {
        aiService: document.getElementById('ai-service').value,
        aiApiKey: document.getElementById('ai-api-key').value.trim(),
        aiModel: this.currentConfig.aiModel,
        aiTemperature: parseFloat(document.getElementById('ai-temperature').value),
        aiMaxTokens: parseInt(document.getElementById('ai-max-tokens').value),
        showNotifications: document.getElementById('show-notifications').checked,
        autoSave: document.getElementById('auto-save').checked
      };

      // Security validation
      if (!config.aiApiKey) {
        this.showStatus('请填写API密钥', 'error');
        return;
      }

      // Validate API key format (basic validation)
      if (config.aiApiKey.length < 10) {
        this.showStatus('API密钥格式不正确，请检查', 'error');
        return;
      }

      // Validate service-specific key patterns
      const keyPatterns = {
        openai: /^sk-/,
        claude: /^sk-ant-/,
        deepseek: /^[a-zA-Z0-9]{20,}$/
      };

      const pattern = keyPatterns[config.aiService];
      if (pattern && !pattern.test(config.aiApiKey)) {
        this.showStatus(`${config.aiService === 'openai' ? 'OpenAI' : config.aiService === 'claude' ? 'Claude' : 'DeepSeek'} API密钥格式不正确`, 'error');
        return;
      }

      // Save config
      const response = await this.sendMessage('SET_CONFIG', config);

      if (response.success) {
        this.currentConfig = config;
        this.showStatus('设置已保存', 'success');

        // Notify other extension contexts about config change
        chrome.runtime.sendMessage({ type: 'CONFIG_UPDATED', data: config });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('保存失败：' + error.message, 'error');
    } finally {
      // Restore button state
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }

  async resetSettings() {
    if (!confirm('确定要重置所有设置为默认值吗？')) {
      return;
    }

    try {
      const defaultConfig = {
        aiService: 'openai',
        aiModel: 'gpt-3.5-turbo',
        aiTemperature: 0.7,
        aiMaxTokens: 1024,
        showNotifications: true,
        autoSave: true
      };

      const response = await this.sendMessage('SET_CONFIG', defaultConfig);

      if (response.success) {
        this.currentConfig = defaultConfig;
        this.updateUI();
        this.updateModelGrid();
        document.getElementById('ai-api-key').value = '';
        this.showStatus('已重置为默认设置', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showStatus('重置失败：' + error.message, 'error');
    }
  }

  async exportSettings() {
    try {
      // Get current config including API key for export
      const response = await this.sendMessage('GET_CONFIG');
      if (!response.success) {
        throw new Error('获取配置失败');
      }

      const config = response.data;
      const dataStr = JSON.stringify(config, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `ai-chat-settings-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      this.showStatus('设置已导出', 'success');
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showStatus('导出失败：' + error.message, 'error');
    }
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);

        // Validate config structure
        const requiredFields = ['aiService', 'aiModel', 'aiTemperature', 'aiMaxTokens'];
        const missingFields = requiredFields.filter(field => !(field in config));

        if (missingFields.length > 0) {
          throw new Error('配置文件缺少必要字段：' + missingFields.join(', '));
        }

        // Save imported config
        const response = await this.sendMessage('SET_CONFIG', config);
        if (response.success) {
          this.currentConfig = config;
          this.updateUI();
          this.updateModelGrid();
          this.showStatus('设置已导入', 'success');
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Failed to import settings:', error);
        this.showStatus('导入失败：' + error.message, 'error');
      }
    };

    input.click();
  }

  async clearHistory() {
    if (!confirm('确定要清除所有对话历史记录吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await this.sendMessage('CLEAR_CHAT_HISTORY');
      if (response.success) {
        this.showStatus('历史记录已清除', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      this.showStatus('清除失败：' + error.message, 'error');
    }
  }

  showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    statusDiv.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
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

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
