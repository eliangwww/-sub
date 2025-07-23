// ... (existing code)

// Add new KV keys for the variables
let KV_SUBAPI_KEY = 'SUBAPI_CONFIG';
let KV_SUBCONFIG_KEY = 'SUBCONFIG_URL';
let KV_TGTOKEN_KEY = 'TG_BOT_TOKEN';
let KV_TGID_KEY = 'TG_CHAT_ID';

export default {
    async fetch(request, env) {
        // ... (existing code)

        // Prioritize KV values for dynamic configuration
        if (env.KV) {
            subConverter = await env.KV.get(KV_SUBAPI_KEY) || env.SUBAPI || subConverter;
            subConfig = await env.KV.get(KV_SUBCONFIG_KEY) || env.SUBCONFIG || subConfig;
            BotToken = await env.KV.get(KV_TGTOKEN_KEY) || env.TGTOKEN || BotToken;
            ChatID = await env.KV.get(KV_TGID_KEY) || env.TGID || ChatID;

            // Existing KV handling for LINK.txt
            await 迁移地址列表(env, 'LINK.txt');
            if (userAgent.includes('mozilla') && !url.search) {
                await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
                // Modify KV function call to include new variable keys
                return await KV(request, env, 'LINK.txt', 访客订阅, {
                    subApi: subConverter,
                    subConfig: subConfig,
                    tgToken: BotToken,
                    tgId: ChatID
                });
            } else {
                MainData = await env.KV.get('LINK.txt') || MainData;
            }
        } else {
            MainData = env.LINK || MainData;
            if (env.LINKSUB) urls = await ADD(env.LINKSUB);
        }

        // ... (rest of the fetch function)
    }
};

// ... (existing helper functions)

async function KV(request, env, txt = 'ADD.txt', guest, currentSettings = {}) {
    const url = new URL(request.url);
    try {
        if (request.method === "POST") {
            if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
            try {
                const formData = await request.formData(); // Assuming form submission for new variables
                const content = formData.get('content') || await request.text(); // Get textarea content or direct text for old method
                const newSubApi = formData.get('subapi');
                const newSubConfig = formData.get('subconfig');
                const newTgToken = formData.get('tgtoken');
                const newTgId = formData.get('tgid');

                await env.KV.put(txt, content);
                if (newSubApi) await env.KV.put(KV_SUBAPI_KEY, newSubApi);
                if (newSubConfig) await env.KV.put(KV_SUBCONFIG_KEY, newSubConfig);
                if (newTgToken) await env.KV.put(KV_TGTOKEN_KEY, newTgToken);
                if (newTgId) await env.KV.put(KV_TGID_KEY, newTgId);

                return new Response("保存成功");
            } catch (error) {
                console.error('保存KV时发生错误:', error);
                return new Response("保存失败: " + error.message, { status: 500 });
            }
        }

        let content = '';
        let hasKV = !!env.KV;
        let currentSubApi = currentSettings.subApi || '';
        let currentSubConfig = currentSettings.subConfig || '';
        let currentTgToken = currentSettings.tgToken || '';
        let currentTgId = currentSettings.tgId || '';


        if (hasKV) {
            try {
                content = await env.KV.get(txt) || '';
            } catch (error) {
                console.error('读取KV时发生错误:', error);
                content = '读取数据时发生错误: ' + error.message;
            }
        }

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${FileName} 订阅管理面板</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        /* ... (existing CSS) ... */
                        .form-group {
                            margin-bottom: 10px;
                        }
                        .form-group label {
                            display: block;
                            margin-bottom: 5px;
                            font-weight: bold;
                        }
                        .form-group input[type="text"] {
                            width: calc(100% - 22px); /* Adjust for padding and border */
                            padding: 10px;
                            border: 1px solid var(--border-color);
                            border-radius: 4px;
                            background: #283747;
                            color: var(--text-color);
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"><\/script>
                </head>
                <body>
                    <div class="container">
                        <h1>${FileName} 订阅管理面板</h1>
                        
                        <details open>
                            <summary>⭐ 管理员订阅 (Admin Links)</summary>
                            <div class="content-wrapper">
                                </div>
                        </details>

                        <details>
                            <summary>😎 访客订阅 (Guest Links)</summary>
                            <div class="content-wrapper">
                                </div>
                        </details>

                        <details open>
                            <summary>⚙️ 订阅转换配置 & Telegram (Converter Config & TG)</summary>
                            <div class="content-wrapper">
                                ${hasKV ? `
                                <form id="configForm">
                                    <div class="form-group">
                                        <label for="subapi">订阅转换后端 (SUBAPI):</label>
                                        <input type="text" id="subapi" name="subapi" value="${currentSubApi}" placeholder="e.g., SUBAPI.cmliussss.net">
                                    </div>
                                    <div class="form-group">
                                        <label for="subconfig">订阅转换配置 (SUBCONFIG):</label>
                                        <input type="text" id="subconfig" name="subconfig" value="${currentSubConfig}" placeholder="e.g., https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini">
                                    </div>
                                    <div class="form-group">
                                        <label for="tgtoken">Telegram Bot Token (TG TOKEN):</label>
                                        <input type="text" id="tgtoken" name="tgtoken" value="${currentTgToken}" placeholder="Optional: Your Telegram Bot Token">
                                    </div>
                                    <div class="form-group">
                                        <label for="tgid">Telegram Chat ID (TG ID):</label>
                                        <input type="text" id="tgid" name="tgid" value="${currentTgId}" placeholder="Optional: Your Telegram Chat ID">
                                    </div>
                                    <div class="save-container">
                                        <button class="save-btn" type="button" onclick="saveConfig(this)">保存配置</button>
                                        <span class="save-status" id="configSaveStatus"></span>
                                    </div>
                                </form>
                                ` : '<p>请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                            </div>
                        </details>

                        <details open>
                            <summary>📝 订阅列表编辑 (Editor)</summary>
                            <div class="content-wrapper">
                                ${hasKV ? `
                                <textarea class="editor" 
                                    placeholder="在此输入或粘贴节点和订阅链接，每行一个..."
                                    id="content" name="content">${content}</textarea>
                                <div class="save-container">
                                    <button class="save-btn" type="button" onclick="saveContent(this)">保存内容</button>
                                    <span class="save-status" id="saveStatus"></span>
                                </div>
                                ` : '<p>请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                            </div>
                        </details>
                        
                        <div class="footer">
                            </div>
                    </div>

                    <script>
                    // ... (existing copyToClipboard, replaceFullwidthColon functions) ...

                    function saveContent(button) {
                        // ... (existing saveContent logic for textarea) ...
                        // This would be for the main subscription list.
                        // You might need to adjust the fetch body to send only the textarea content.
                        const textarea = document.getElementById('content');
                        const statusElem = document.getElementById('saveStatus');
                        button.disabled = true;
                        statusElem.textContent = '保存中...';

                        fetch(window.location.href, {
                            method: 'POST',
                            body: textarea.value,
                            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                            cache: 'no-cache'
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(\`HTTP error! status: \${response.status}\`);
                            }
                            return response.text();
                        })
                        .then(result => {
                            const now = new Date().toLocaleTimeString();
                            document.title = \`保存成功 \${now}\`;
                            statusElem.textContent = \`✅ 保存成功 at \${now}\`;
                            statusElem.style.color = '#2ecc71';
                        })
                        .catch(error => {
                            console.error('Save error:', error);
                            statusElem.textContent = \`❌ 保存失败: \${error.message}\`;
                            statusElem.style.color = '#e74c3c';
                        })
                        .finally(() => {
                            button.textContent = '保存内容';
                            button.disabled = false;
                            setTimeout(() => statusElem.textContent = '', 3000);
                        });
                    }

                    function saveConfig(button) {
                        const statusElem = document.getElementById('configSaveStatus');
                        button.disabled = true;
                        statusElem.textContent = '保存中...';

                        const formData = new FormData(document.getElementById('configForm'));
                        // You might need to add the 'content' field to the formData even if not directly changed,
                        // or modify the server to handle partial updates. For simplicity, we'll send all config fields.

                        fetch(window.location.href, {
                            method: 'POST',
                            body: formData, // Send as FormData
                            cache: 'no-cache'
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(\`HTTP error! status: \${response.status}\`);
                            }
                            return response.text();
                        })
                        .then(result => {
                            const now = new Date().toLocaleTimeString();
                            statusElem.textContent = \`✅ 配置保存成功 at \${now}\`;
                            statusElem.style.color = '#2ecc71';
                        })
                        .catch(error => {
                            console.error('Config save error:', error);
                            statusElem.textContent = \`❌ 配置保存失败: \${error.message}\`;
                            statusElem.style.color = '#e74c3c';
                        })
                        .finally(() => {
                            button.textContent = '保存配置';
                            button.disabled = false;
                            setTimeout(() => statusElem.textContent = '', 3000);
                        });
                    }
		
                    if (document.querySelector('.editor')) {
                        // ... (existing textarea event listener) ...
                    }
                    <\/script>
                </body>
            </html>
        `;

        return new Response(html, {
            headers: { "Content-Type": "text/html;charset=utf-8" }
        });
    } catch (error) {
        // ... (error handling) ...
    }
}
