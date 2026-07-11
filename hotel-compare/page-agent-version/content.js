// hotel-compare/page-agent-version/content.js
/**
 * 酒店比价 — Content Script
 * ===========================
 * Runs inside each hotel-platform tab.
 *
 * Responsibilities:
 *   1. Receive RUN_AGENT from background, inject page-agent IIFE, execute task.
 *   2. Listen for page-agent activity events and forward structured AGENT_STEP
 *      messages to background (platform, stepNum, goal, actions, url).
 *   3. Return AGENT_RESULT when the agent finishes.
 */

/** Counter for agent steps within the current execution */
let stepCounter = 0;

const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/plan/v3';
const DEFAULT_ARK_CHAT_MODEL = 'doubao-seed-2-0-code-preview-260215';

// ---------------------------------------------------------------------------
// Message listener — from background.js
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RUN_AGENT') {
    stepCounter = 0;
    runPageAgent(msg.task, msg.platform);
    sendResponse({ received: true });
  }
  return true;
});

// ---------------------------------------------------------------------------
// Agent execution
// ---------------------------------------------------------------------------

async function runPageAgent(task, platform) {
  try {
    log(platform, 'page-agent 初始化中...');

    const result = await injectAndRun(task, platform);

    chrome.runtime.sendMessage({
      type: 'AGENT_RESULT',
      result,
    });
  } catch (err) {
    log(platform, `错误: ${err.message}`);
    chrome.runtime.sendMessage({
      type: 'AGENT_RESULT',
      result: { success: false, data: err.message },
    });
  }
}

// ---------------------------------------------------------------------------
// Inject page-agent into the page context and run
// ---------------------------------------------------------------------------

async function injectAndRun(task, platform) {
  const pageAgentConfig = await getPageAgentConfig();
  if (!pageAgentConfig.apiKey) {
    throw new Error('ARK_API_KEY is not configured in chrome.storage.local');
  }

  return new Promise((resolve, reject) => {
    // Listen for messages from the injected page-context script
    window.addEventListener('message', function handler(event) {
      if (event.data?.type === 'PAGE_AGENT_RESULT') {
        window.removeEventListener('message', handler);
        resolve(event.data.result);
      }
      if (event.data?.type === 'PAGE_AGENT_LOG') {
        log(platform, event.data.text);
      }
      if (event.data?.type === 'PAGE_AGENT_STEP') {
        // Structured step data from the page context
        handlePageAgentStep(platform, event.data.step);
      }
    });

    // Inject the page-agent library
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/page-agent.iife.js');
    script.onload = () => {
      const execScript = document.createElement('script');
      execScript.textContent = `
        (async () => {
          try {
            const agent = new window.PageAgent.PageAgentCore({
              provider: 'openai',
              model: ${JSON.stringify(pageAgentConfig.model)},
              apiKey: ${JSON.stringify(pageAgentConfig.apiKey)},
              baseURL: ${JSON.stringify(pageAgentConfig.baseUrl)},
              maxSteps: 25,
              language: 'zh-CN',
            });

            let stepNum = 0;

            // Listen for activity events and post structured step data
            agent.addEventListener('activity', (e) => {
              const a = e.detail;
              if (a.type === 'executing') {
                stepNum++;
                // Post structured step info to the content script
                window.postMessage({
                  type: 'PAGE_AGENT_STEP',
                  step: {
                    stepNum: stepNum,
                    goal: a.tool || '',
                    actions: [a.tool + '(' + JSON.stringify(a.input || {}).substring(0, 200) + ')'],
                    url: window.location.href,
                  },
                }, '*');

                // Also post legacy log for backward compatibility
                window.postMessage({
                  type: 'PAGE_AGENT_LOG',
                  text: 'Step ' + stepNum + ': ' + a.tool + '(' + JSON.stringify(a.input).substring(0, 80) + ')',
                }, '*');
              }
            });

            const result = await agent.execute(${JSON.stringify(task)});
            window.postMessage({
              type: 'PAGE_AGENT_RESULT',
              result: { success: true, data: JSON.stringify(result) },
            }, '*');
            agent.dispose();
          } catch (err) {
            window.postMessage({
              type: 'PAGE_AGENT_RESULT',
              result: { success: false, data: err.message },
            }, '*');
          }
        })();
      `;
      document.head.appendChild(execScript);
    };
    script.onerror = () => reject(new Error('Failed to load page-agent library'));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Forward structured step data to background.js
// ---------------------------------------------------------------------------

function handlePageAgentStep(platform, step) {
  stepCounter++;
  chrome.runtime.sendMessage({
    type: 'AGENT_STEP',
    platform,
    stepNum: step.stepNum || stepCounter,
    goal: step.goal || '',
    actions: step.actions || [],
    url: step.url || window.location.href,
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPageAgentConfig() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([
      'ARK_API_KEY',
      'ARK_BASE_URL',
      'ARK_CHAT_MODEL',
      'PAGE_AGENT_API_KEY',
      'PAGE_AGENT_BASE_URL',
      'PAGE_AGENT_MODEL',
    ], (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const baseUrl = items.ARK_BASE_URL || items.PAGE_AGENT_BASE_URL || DEFAULT_ARK_BASE_URL;
      resolve({
        apiKey: items.ARK_API_KEY || items.PAGE_AGENT_API_KEY || '',
        baseUrl: baseUrl.replace(/\/+$/, ''),
        model: items.ARK_CHAT_MODEL || items.PAGE_AGENT_MODEL || DEFAULT_ARK_CHAT_MODEL,
      });
    });
  });
}

function log(platform, text) {
  chrome.runtime.sendMessage({
    type: 'AGENT_LOG',
    platform,
    text,
  }).catch(() => {});
}
