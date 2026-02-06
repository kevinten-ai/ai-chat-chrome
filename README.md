# 🤖 AI页面助手 - Chrome扩展

一个基于Chrome扩展Manifest V3开发的AI聊天助手，提供悬浮弹窗界面，支持多AI模型对话。

## ✨ 主要特性

- 🚀 **悬浮弹窗界面** - 右下角悬浮设计，不影响页面操作
- 🧠 **多AI模型支持** - 支持OpenAI、Claude、DeepSeek等多种主流模型
- 💬 **实时对话** - 支持流式响应和实时交互
- ⚙️ **灵活配置** - 完整的设置页面，支持参数调节
- 💾 **本地存储** - 对话历史本地保存，保护隐私
- 🎨 **现代化UI** - 响应式设计，支持深色模式
- 🔒 **隐私保护** - API密钥本地存储，不上传任何数据

## 📦 安装方式

### 方法一：从Chrome网上应用店安装（推荐）
1. 打开 [Chrome网上应用店](https://chrome.google.com/webstore)
2. 搜索 "AI页面助手"
3. 点击"添加到Chrome"

### 方法二：开发者模式安装
1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，输入 `chrome://extensions/`
3. 开启右上角"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹 `ai-chat-chrome`

## 🚀 使用指南

### 初次使用
1. 安装扩展后，点击扩展图标 ⚙️
2. 在设置页面配置您的AI API密钥
3. 选择您偏好的AI模型和参数
4. 保存设置

### 开始对话
1. 在任何网页上点击右下角的AI助手按钮 🤖
2. 在弹出的聊天框中输入您的问题
3. 按Enter键发送，或点击发送按钮
4. AI会实时回复您的消息

### 快捷操作
- **点击扩展图标** - 查看状态和最近对话
- **新建对话** - 开始新的对话会话
- **设置页面** - 调整AI模型和参数
- **最小化** - 临时隐藏聊天窗口

## ⚙️ 配置说明

### 支持的AI服务

#### OpenAI
- **支持模型**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **API密钥**: 在 [OpenAI平台](https://platform.openai.com/api-keys) 获取

#### Claude (Anthropic)
- **支持模型**: Claude 3 Opus, Sonnet, Haiku
- **API密钥**: 在 [Anthropic控制台](https://console.anthropic.com/) 获取

#### DeepSeek
- **支持模型**: DeepSeek Chat, DeepSeek Coder
- **API密钥**: 在 [DeepSeek平台](https://platform.deepseek.com/api_keys) 获取

### 参数设置
- **温度 (Temperature)**: 控制输出的随机性 (0.0-2.0)
  - 较低值: 更确定性回答
  - 较高值: 更创造性回答
- **最大响应长度**: 控制AI回复的最大token数
- **显示通知**: 是否在收到回复时显示浏览器通知

## 🎯 界面说明

### 悬浮聊天窗口
- **消息区域**: 显示对话历史
- **输入框**: 支持多行输入，按Shift+Enter换行
- **控制按钮**: 最小化、设置、关闭

### 扩展弹窗
- **状态显示**: API连接状态、当前模型、对话数量
- **快速操作**: 打开聊天、新建对话、进入设置
- **最近对话**: 显示最近的对话记录

### 设置页面
- **AI助手**: 配置API和模型参数
- **通用设置**: 界面偏好和数据管理
- **关于**: 版本信息和帮助链接

## 🔧 开发指南

### 项目结构
```
ai-chat-chrome/
├── manifest.json          # 扩展配置文件
├── src/
│   ├── background.js      # 后台服务脚本
│   ├── content.js         # 内容脚本（悬浮UI）
│   ├── styles.css         # 全局样式
│   ├── popup.html/js      # 扩展弹窗
│   └── options.html/js    # 设置页面
├── assets/
│   ├── icon.svg           # 图标源文件
│   └── README.md          # 图标生成说明
├── test_page.html         # 功能测试页面
└── README.md              # 项目说明
```

### 本地开发
1. 克隆项目到本地
2. 在Chrome中开启开发者模式
3. 加载扩展程序进行测试
4. 修改代码后刷新扩展

### 构建发布
1. 验证所有文件完整性
2. 使用 `test_page.html` 测试所有功能
3. 验证manifest.json配置正确
4. 压缩为ZIP文件（排除不必要的文件）
5. 提交到Chrome网上应用店

#### 构建命令
```bash
# 在项目根目录执行
zip -r ai-chat-extension-v1.0.0.zip . -x "*.git*" "*.DS_Store" "node_modules/*" "*.log"
```

### 调试技巧
- 使用 `console.log()` 在background script中调试
- 在content script中使用 `console.log()` 调试UI
- 使用Chrome开发者工具的"扩展"面板
- 查看 `chrome://extensions/` 的错误信息
- 使用 `test_page.html` 进行功能测试

### 测试页面
项目包含 `test_page.html` 测试页面，用于验证扩展的基本功能：
- 扩展安装状态检查
- 消息传递机制测试
- 配置读写功能测试
- UI触发功能测试

在Chrome中打开此页面可以快速验证扩展是否正常工作。

## 🔒 隐私与安全

### 数据存储
- **API密钥**: 仅存储在本地Chrome存储中
- **对话历史**: 本地存储，不上传到任何服务器
- **使用统计**: 不收集任何个人数据

### 权限说明
- `storage`: 保存配置和对话历史
- `activeTab`: 在当前标签页注入聊天界面
- `scripting`: 动态注入内容脚本
- `host_permissions`: 访问AI服务API（仅限指定域名）

### 安全措施
- API密钥加密存储
- HTTPS传输保证
- 本地数据隔离
- 无第三方数据收集

## 🐛 故障排除

### 常见问题

**Q: 扩展无法加载？**
A: 确认Chrome版本支持Manifest V3，检查manifest.json语法

**Q: AI无法回复？**
A: 检查API密钥是否正确，确认网络连接正常

**Q: 聊天窗口不显示？**
A: 刷新页面，确认content script已注入

**Q: 设置无法保存？**
A: 检查Chrome存储权限，尝试重启浏览器

### 获取帮助
- 查看浏览器控制台错误信息
- 检查 `chrome://extensions/` 的扩展详情
- 提交GitHub Issue获取技术支持

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🚀 支持OpenAI、Claude、DeepSeek
- 💬 悬浮聊天界面
- ⚙️ 完整的设置页面
- 💾 本地对话历史存储
- 🧪 添加功能测试页面
- 🛡️ 改进错误处理和边界情况
- 🎨 使用SVG图标，提升兼容性
- 🔧 优化消息传递机制
- 🚀 性能优化和缓存机制
- 🔒 安全性增强和API密钥验证
- 📱 响应式设计和无障碍访问
- 🎯 配置验证和跨页面同步

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork此项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢以下开源项目的贡献：
- Chrome Extension Manifest V3
- 各AI服务提供商的API
- 开源社区的技术支持

---

**开发者**: AI助手团队
**版本**: 1.0.0
**兼容性**: Chrome 88+