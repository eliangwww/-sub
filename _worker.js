// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://raw.githubusercontent.com/mfuu/v2ray/master/v2ray
`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; //订阅配置文件
let subProtocol = 'https';

// Add new KV keys for the variables
let KV_SUBAPI_KEY = 'SUBAPI_CONFIG';
let KV_SUBCONFIG_KEY = 'SUBCONFIG_URL';
let KV_TGTOKEN_KEY = 'TG_BOT_TOKEN';
let KV_TGID_KEY = 'TG_CHAT_ID';
let KV_FILENAME_KEY = 'FILE_NAME';
let KV_URL302_KEY = 'URL_302';
let KV_GUESTTOKEN_KEY = 'GUEST_TOKEN';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		mytoken = env.TOKEN || mytoken;
		TG = env.TG || TG;
		
		// Prioritize KV values for dynamic configuration
		if (env.KV) {
            subConverter = await env.KV.get(KV_SUBAPI_KEY) || env.SUBAPI || subConverter;
            subConfig = await env.KV.get(KV_SUBCONFIG_KEY) || env.SUBCONFIG || subConfig;
            BotToken = await env.KV.get(KV_TGTOKEN_KEY) || env.TGTOKEN || BotToken;
            ChatID = await env.KV.get(KV_TGID_KEY) || env.TGID || ChatID;
            FileName = await env.KV.get(KV_FILENAME_KEY) || env.SUBNAME || FileName;
            guestToken = await env.KV.get(KV_GUESTTOKEN_KEY) || env.GUESTTOKEN || env.GUEST || guestToken;
            env.URL302 = await env.KV.get(KV_URL302_KEY) || env.URL302;
        } else {
            BotToken = env.TGTOKEN || BotToken;
            ChatID = env.TGID || ChatID;
            subConverter = env.SUBAPI || subConverter;
        }

		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		
		FileName = env.SUBNAME || FileName; // This line seems redundant after the KV read above

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;
		//console.log(`${fakeUserID}\n${fakeHostName}`); // 打印fakeID

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					return await KV(request, env, 'LINK.txt', 访客订阅, {
                        subApi: subConverter,
                        subConfig: subConfig,
                        tgToken: BotToken,
                        tgId: ChatID,
                        fileName: FileName,
                        url302: env.URL302,
                        guestToken: guestToken
                    });
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
			} else {
				MainData = env.LINK || MainData;
				if (env.LINKSUB) urls = await ADD(env.LINKSUB);
			}
			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) {
					订阅链接 += x + '\n';
				} else {
					自建节点 += x + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);

			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || userAgent.includes('subconverter') || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
					订阅格式 = 'singbox';
				} else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
					订阅格式 = 'surge';
				} else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
					订阅格式 = 'quanx';
				} else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
					订阅格式 = 'loon';
				} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
					订阅格式 = 'clash';
				}
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			//console.log(订阅转换URL);
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				console.log(请求订阅响应内容);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
			}

			if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");
			//修复中文错误
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			//const text = String.fromCharCode.apply(null, encodedData);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			//去重
			const uniqueLines = new Set(text.split('\n'));
			let result = [...uniqueLines].join('\n');
			//console.log(result);

			if (订阅格式 == 'base64' && !userAgent.includes('subconverter') && 订阅转换URL.includes('://')) {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				try {
					const subConverterResponse = await fetch(subConverterUrl);
					if (subConverterResponse.ok) {
						const subConverterContent = await subConverterResponse.text();
						result += '\n' + atob(subConverterContent);
					}
				} catch (error) {
					console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
				}
			}

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;

						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}

					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}

				base64Data = encodeBase64(result)
			}

			// 构建响应头对象
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
				//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			} else if (订阅格式 == 'clash') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'singbox') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'surge') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'quanx') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			} else if (订阅格式 == 'loon') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
			}
			//console.log(订阅转换URL);
			try {
				const subConverterResponse = await fetch(subConverterUrl);//订阅转换
				if (!subConverterResponse.ok) return new Response(base64Data, { headers: responseHeaders });
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				// 只有非浏览器订阅才会返回SUBNAME
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');	// 替换为换行
	//console.log(addtext);
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n');
	//console.log(add);
	return add;
}

async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
	return text;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	// 解析目标 URL
	let parsedURL = new URL(fullURL);
	console.log(parsedURL);
	// 提取并可能修改 URL 组件
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	// 处理 pathname
	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	// 构建新的 URL
	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	// 反向代理请求
	let response = await fetch(newURL);

	// 创建新的响应
	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	// 添加自定义头部，包含 URL 信息
	//newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
	//newResponse.headers.set('X-Original-URL', fullURL);
	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)]; // 去重
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
	const timeout = setTimeout(() => {
		controller.abort(); // 2秒后取消所有请求
	}, 2000);

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

		// 遍历所有响应
		const modifiedResponses = responses.map((response, index) => {
			// 检查是否请求成功
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
			};
		});

		console.log(modifiedResponses); // 输出修改后的响应数组

		for (const response of modifiedResponses) {
			// 检查响应状态是否为'fulfilled'
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null'; // 获取响应的内容
				if (content.includes('proxies:')) {
					//console.log('Clash订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Clash 配置
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					//console.log('Singbox订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
				} else if (content.includes('://')) {
					//console.log('明文订阅: ' + response.apiUrl);
					newapi += content + '\n'; // 追加内容
				} else if (isValidBase64(content)) {
					//console.log('Base64订阅: ' + response.apiUrl);
					newapi += base64Decode(content) + '\n'; // 解码并追加内容
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error); // 捕获并输出错误信息
	} finally {
		clearTimeout(timeout); // 清除定时器
	}

	const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
	// 返回处理后的结果
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	// 设置自定义 User-Agent
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	// 构建新的请求对象
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		cf: {
			// 忽略SSL证书验证
			insecureSkipVerify: true,
			// 允许自签名证书
			allowUntrusted: true,
			// 禁用证书验证
			validateCertificate: false
		}
	});

	// 输出请求的详细信息
	console.log(`请求URL: ${targetUrl}`);
	console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
	console.log(`请求方法: ${request.method}`);
	console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

	// 发送请求并返回响应
	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	// 先移除所有空白字符(空格、换行、回车等)
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		// 写入新位置
		await env.KV.put(txt, 旧数据);
		// 删除旧数据
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'ADD.txt', guest, currentSettings = {}) {
	const url = new URL(request.url);
	try {
		// POST request handling
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const formData = await request.formData(); // Use formData to parse multiple fields
				const content = formData.get('content');
				const newSubApi = formData.get('subapi');
				const newSubConfig = formData.get('subconfig');
				const newTgToken = formData.get('tgtoken');
				const newTgId = formData.get('tgid');
				const newFileName = formData.get('filename');
				const newUrl302 = formData.get('url302');
				const newGuestToken = formData.get('guesttoken');

				// Save subscription list content
				if (content !== null) { // Check if content field exists in form
                    await env.KV.put(txt, content);
                }

				// Save new configuration variables
				if (newSubApi !== null) await env.KV.put(KV_SUBAPI_KEY, newSubApi);
				if (newSubConfig !== null) await env.KV.put(KV_SUBCONFIG_KEY, newSubConfig);
				if (newTgToken !== null) await env.KV.put(KV_TGTOKEN_KEY, newTgToken);
				if (newTgId !== null) await env.KV.put(KV_TGID_KEY, newTgId);
				if (newFileName !== null) await env.KV.put(KV_FILENAME_KEY, newFileName);
				if (newUrl302 !== null) await env.KV.put(KV_URL302_KEY, newUrl302);
				if (newGuestToken !== null) await env.KV.put(KV_GUESTTOKEN_KEY, newGuestToken);

				return new Response("保存成功");
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		// GET request part with new frontend
		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
                currentSettings.subApi = await env.KV.get(KV_SUBAPI_KEY) || currentSettings.subApi || subConverter;
                currentSettings.subConfig = await env.KV.get(KV_SUBCONFIG_KEY) || currentSettings.subConfig || subConfig;
                currentSettings.tgToken = await env.KV.get(KV_TGTOKEN_KEY) || currentSettings.tgToken || BotToken;
                currentSettings.tgId = await env.KV.get(KV_TGID_KEY) || currentSettings.tgId || ChatID;
                currentSettings.fileName = await env.KV.get(KV_FILENAME_KEY) || currentSettings.fileName || FileName;
                currentSettings.url302 = await env.KV.get(KV_URL302_KEY) || currentSettings.url302 || env.URL302;
                currentSettings.guestToken = await env.KV.get(KV_GUESTTOKEN_KEY) || currentSettings.guestToken || guestToken;
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				content = '读取数据时发生错误: ' + error.message;
			}
		}

		const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${currentSettings.fileName} 订阅管理面板</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #4361ee;
            --primary-light: #4895ef;
            --secondary: #3f37c9;
            --success: #4cc9f0;
            --danger: #f72585;
            --warning: #f8961e;
            --info: #7209b7;
            --dark: #212529;
            --light: #f8f9fa;
            
            --bg-color: #1a1a2e;
            --card-bg: rgba(26, 26, 46, 0.9);
            --text-color: #e6e6e6;
            --text-muted: #a1a1aa;
            --border-color: #2d3748;
            --input-bg: #2d3748;
            
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            
            --radius: 8px;
            --radius-sm: 4px;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: var(--text-color);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            background-image: url('https://api.imlcd.cn/bg/gq.php');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            background-blend-mode: overlay;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .header {
            padding: 24px;
            background: linear-gradient(135deg, rgba(67, 97, 238, 0.2) 0%, rgba(63, 55, 201, 0.2) 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
        }
        
        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
            margin-bottom: 8px;
        }
        
        .header p {
            color: var(--text-muted);
            font-size: 0.875rem;
        }
        
        /* Accordion Styles */
        .accordion {
            margin: 0;
            padding: 0 24px;
        }
        
        .accordion-item {
            margin-bottom: 16px;
            border-radius: var(--radius);
            overflow: hidden;
            border: 1px solid var(--border-color);
            background: rgba(45, 55, 72, 0.5);
            transition: var(--transition);
        }
        
        .accordion-item:hover {
            border-color: var(--primary);
        }
        
        .accordion-header {
            padding: 16px 20px;
            background: rgba(67, 97, 238, 0.1);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }
        
        .accordion-header:hover {
            background: rgba(67, 97, 238, 0.15);
        }
        
        .accordion-title {
            font-weight: 600;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .accordion-icon {
            transition: var(--transition);
        }
        
        .accordion-item.active .accordion-icon {
            transform: rotate(180deg);
        }
        
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        
        .accordion-item.active .accordion-content {
            max-height: 2000px;
            transition: max-height 0.5s ease-in;
        }
        
        .accordion-body {
            padding: 20px;
        }
        
        /* Subscription Links */
        .subscription-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            margin-top: 12px;
        }
        
        .subscription-card {
            background: rgba(30, 41, 59, 0.5);
            border-radius: var(--radius-sm);
            padding: 16px;
            border: 1px solid var(--border-color);
            transition: var(--transition);
        }
        
        .subscription-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }
        
        .subscription-card h3 {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--primary-light);
        }
        
        .subscription-link {
            font-size: 0.8125rem;
            word-break: break-all;
            margin-bottom: 12px;
            color: var(--text-color);
        }
        
        .subscription-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        
        .btn {
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--primary-light);
        }
        
        .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }
        
        .btn-outline:hover {
            border-color: var(--primary);
            color: var(--primary-light);
        }
        
        .btn-sm {
            padding: 4px 8px;
            font-size: 0.6875rem;
        }
        
        /* QR Code */
        .qr-container {
            margin-top: 12px;
            padding: 8px;
            background: white;
            border-radius: var(--radius-sm);
            display: inline-block;
        }
        
        /* Form Styles */
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);
        }
        
        .form-control {
            width: 100%;
            padding: 10px 12px;
            background: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            color: var(--text-color);
            font-family: inherit;
            font-size: 0.875rem;
            transition: var(--transition);
        }
        
        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }
        
        /* Editor */
        .editor-container {
            margin-top: 16px;
        }
        
        .editor {
            width: 100%;
            height: 350px;
            padding: 12px;
            background: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            color: var(--text-color);
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            resize: vertical;
            transition: var(--transition);
        }
        
        .editor:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }
        
        /* Status Messages */
        .status {
            font-size: 0.8125rem;
            margin-top: 8px;
            padding: 6px 10px;
            border-radius: var(--radius-sm);
        }
        
        .status-success {
            background: rgba(76, 201, 240, 0.1);
            color: var(--success);
            border: 1px solid rgba(76, 201, 240, 0.2);
        }
        
        .status-error {
            background: rgba(247, 37, 133, 0.1);
            color: var(--danger);
            border: 1px solid rgba(247, 37, 133, 0.2);
        }
        
        .status-warning {
            background: rgba(248, 150, 30, 0.1);
            color: var(--warning);
            border: 1px solid rgba(248, 150, 30, 0.2);
        }
        
        /* Toast Notifications */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(200%);
            transition: transform 0.3s ease-out;
        }
        
        .toast.toast-success {
            background-color: var(--success);
        }
        
        .toast.toast-error {
            background-color: var(--danger);
        }
        
        .toast.toast-warning {
            background-color: var(--warning);
        }
        
        .toast.toast-info {
            background-color: var(--info);
        }
        
        .toast.animate-fade {
            transform: translateX(0);
        }
        
        .toast.fade-out {
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .animate-fade {
            animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        
        /* Footer */
        .footer {
            padding: 20px 24px;
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
            background: rgba(26, 26, 46, 0.5);
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-bottom: 12px;
        }
        
        .footer-link {
            color: var(--text-muted);
            text-decoration: none;
            transition: var(--transition);
        }
        
        .footer-link:hover {
            color: var(--primary-light);
        }
        
        /* Badges */
        .badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 0.6875rem;
            font-weight: 600;
            border-radius: 999px;
            background: var(--primary);
            color: white;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                border-radius: 0;
            }
            
            .subscription-grid {
                grid-template-columns: 1fr;
            }
            
            .header, .accordion {
                padding: 16px;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${currentSettings.fileName} 订阅管理面板</h1>
            <p>轻松管理您的订阅链接和配置</p>
        </div>
        
        <div class="accordion">
            <!-- 管理员订阅 -->
            <div class="accordion-item active">
                <div class="accordion-header">
                    <div class="accordion-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <span>管理员订阅 (Admin Links)</span>
                    </div>
                    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="accordion-content">
                    <div class="accordion-body">
                        <div class="subscription-grid">
                            <div class="subscription-card">
                                <h3>自适应订阅</h3>
                                <div class="subscription-link" id="admin-default">https://${url.hostname}/${mytoken}</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sub','qrcode_0')">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        复制链接
                                    </button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_0', 'https://${url.hostname}/${mytoken}?sub')">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="3" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="14" width="7" height="7"></rect>
                                            <rect x="3" y="14" width="7" height="7"></rect>
                                        </svg>
                                        生成二维码
                                    </button>
                                </div>
                                <div class="qr-container" id="qrcode_0"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Base64</h3>
                                <div class="subscription-link" id="admin-b64">https://${url.hostname}/${mytoken}?b64</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?b64','qrcode_1')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_1', 'https://${url.hostname}/${mytoken}?b64')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="qrcode_1"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Clash</h3>
                                <div class="subscription-link" id="admin-clash">https://${url.hostname}/${mytoken}?clash</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?clash','qrcode_2')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_2', 'https://${url.hostname}/${mytoken}?clash')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="qrcode_2"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Sing-Box</h3>
                                <div class="subscription-link" id="admin-sb">https://${url.hostname}/${mytoken}?sb</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sb','qrcode_3')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_3', 'https://${url.hostname}/${mytoken}?sb')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="qrcode_3"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Surge</h3>
                                <div class="subscription-link" id="admin-surge">https://${url.hostname}/${mytoken}?surge</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?surge','qrcode_4')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_4', 'https://${url.hostname}/${mytoken}?surge')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="qrcode_4"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Loon</h3>
                                <div class="subscription-link" id="admin-loon">https://${url.hostname}/${mytoken}?loon</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?loon','qrcode_5')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('qrcode_5', 'https://${url.hostname}/${mytoken}?loon')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="qrcode_5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 访客订阅 -->
            <div class="accordion-item">
                <div class="accordion-header">
                    <div class="accordion-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>访客订阅 (Guest Links)</span>
                    </div>
                    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="accordion-content">
                    <div class="accordion-body">
                        <p class="status status-warning">访客订阅仅可用于客户端获取节点，无法访问此管理页面。<br>访客TOKEN: <strong>${currentSettings.guestToken}</strong></p>
                        
                        <div class="subscription-grid">
                            <div class="subscription-card">
                                <h3>自适应订阅</h3>
                                <div class="subscription-link" id="guest-default">https://${url.hostname}/sub?token=${currentSettings.guestToken}</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/sub?token=${currentSettings.guestToken}','guest_0')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('guest_0', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="guest_0"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Base64</h3>
                                <div class="subscription-link" id="guest-b64">https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64','guest_1')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('guest_1', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="guest_1"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Clash</h3>
                                <div class="subscription-link" id="guest-clash">https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash','guest_2')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('guest_2', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="guest_2"></div>
                            </div>
                            
                            <div class="subscription-card">
                                <h3>Sing-Box</h3>
                                <div class="subscription-link" id="guest-sb">https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb</div>
                                <div class="subscription-actions">
                                    <button class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb','guest_3')">复制链接</button>
                                    <button class="btn btn-outline btn-sm" onclick="generateQR('guest_3', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb')">生成二维码</button>
                                </div>
                                <div class="qr-container" id="guest_3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 订阅转换配置 -->
            <div class="accordion-item active">
                <div class="accordion-header">
                    <div class="accordion-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>订阅转换配置 & Telegram</span>
                    </div>
                    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="accordion-content">
                    <div class="accordion-body">
                        ${hasKV ? `
                        <form id="configForm">
                            <div class="form-group">
                                <label class="form-label" for="subapi">订阅转换后端 (SUBAPI)</label>
                                <input type="text" class="form-control" id="subapi" name="subapi" value="${currentSettings.subApi}" placeholder="e.g., SUBAPI.cmliussss.net">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="subconfig">订阅转换配置 (SUBCONFIG)</label>
                                <input type="text" class="form-control" id="subconfig" name="subconfig" value="${currentSettings.subConfig}" placeholder="e.g., https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="tgtoken">Telegram Bot Token (TG TOKEN)</label>
                                <input type="text" class="form-control" id="tgtoken" name="tgtoken" value="${currentSettings.tgToken}" placeholder="Optional: Your Telegram Bot Token">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="tgid">Telegram Chat ID (TG ID)</label>
                                <input type="text" class="form-control" id="tgid" name="tgid" value="${currentSettings.tgId}" placeholder="Optional: Your Telegram Chat ID">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="filename">文件名 (SUBNAME)</label>
                                <input type="text" class="form-control" id="filename" name="filename" value="${currentSettings.fileName}" placeholder="e.g., CF-Workers-SUB">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="url302">302重定向URL (URL302)</label>
                                <input type="text" class="form-control" id="url302" name="url302" value="${currentSettings.url302}" placeholder="Optional: https://example.com">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="guesttoken">访客TOKEN (GUESTTOKEN)</label>
                                <input type="text" class="form-control" id="guesttoken" name="guesttoken" value="${currentSettings.guestToken}" placeholder="Optional: auto or UUID">
                            </div>
                            
                            <button class="btn btn-primary" type="button" onclick="saveConfig(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                保存配置
                            </button>
                            <div id="configSaveStatus" class="status"></div>
                        </form>
                        ` : '<p class="status status-error">请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                    </div>
                </div>
            </div>
            
            <!-- 订阅列表编辑 -->
            <div class="accordion-item active">
                <div class="accordion-header">
                    <div class="accordion-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span>订阅列表编辑</span>
                    </div>
                    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="accordion-content">
                    <div class="accordion-body">
                        ${hasKV ? `
                        <div class="editor-container">
                            <textarea class="editor" placeholder="在此输入或粘贴节点和订阅链接，每行一个..." id="content" name="content">${content}</textarea>
                            <button class="btn btn-primary" type="button" onclick="saveContent(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                保存内容
                            </button>
                            <div id="saveStatus" class="status"></div>
                        </div>
                        ` : '<p class="status status-error">请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="https://github.com/cmliu/CF-Workers-SUB" target="_blank" class="footer-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    GitHub Project
                </a>
                <a href="https://t.me/CMLiussss" target="_blank" class="footer-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.2 2.9c-1.5-.7-3.1-1.1-4.8-1.2-1.7-.1-3.4.2-5 .7-.8.3-1.6.7-2.3 1.2-.7.5-1.4 1.1-2 1.8-.6.7-1.1 1.5-1.5 2.3-.4.8-.7 1.7-.9 2.6-.2.9-.3 1.8-.3 2.8v1.2c0 .4.1.8.2 1.2.1.4.3.7.5 1 .2.3.5.5.8.7.3.2.7.3 1.1.3.4 0 .8-.1 1.1-.3.3-.2.6-.4.8-.7.2-.3.4-.6.5-1 .1-.4.2-.8.2-1.2v-1.2c0-.6.1-1.2.2-1.8.1-.6.3-1.2.6-1.8.3-.6.6-1.1 1-1.6.4-.5.9-1 1.4-1.4.5-.4 1.1-.7 1.7-1 .6-.3 1.3-.5 2-.6.7-.1 1.4-.1 2.1 0 .7.1 1.3.3 1.9.6.6.3 1.1.6 1.6 1 .5.4.9.9 1.3 1.4.4.5.7 1.1.9 1.7.2.6.4 1.3.4 2 0 .7-.1 1.4-.3 2-.6.6-.3 1.1-.7 1.6-1.1.5-.4.9-.9 1.3-1.4.4-.5.7-1.1.9-1.7.2-.6.3-1.3.4-2 .1-.7.1-1.4 0-2.1-.1-.7-.3-1.4-.6-2-.3-.6-.7-1.2-1.1-1.7-.4-.5-.9-1-1.4-1.4-.5-.4-1.1-.7-1.7-1z"></path>
                        <path d="M9.3 14.3l-2.6 2.6c-.2.2-.5.4-.8.4-.3 0-.6-.1-.8-.4-.2-.2-.4-.5-.4-.8 0-.3.1-.6.4-.8l2.6-2.6c.2-.2.5-.4.8-.4.3 0 .6.1.8.4.2.2.4.5.4.8 0 .3-.1.6-.4.8z"></path>
                        <path d="M14.7 9.7l-2.6 2.6c-.2.2-.5.4-.8.4-.3 0-.6-.1-.8-.4-.2-.2-.4-.5-.4-.8 0-.3.1-.6.4-.8l2.6-2.6c.2-.2.5-.4.8-.4.3 0 .6.1.8.4.2.2.4.5.4.8 0 .3-.1.6-.4.8z"></path>
                    </svg>
                    Telegram Channel
                </a>
            </div>
            <p>User-Agent: ${request.headers.get('User-Agent')}</p>
        </div>
    </div>

    <script>
    // Initialize accordion functionality
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });
    
    // Copy to clipboard function with toast notification
    function copyToClipboard(text, qrcodeId) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制', 'error');
        });
        
        if (qrcodeId) {
            generateQR(qrcodeId, text);
        }
    }
    
    // Generate QR code
    function generateQR(elementId, text) {
        const qrcodeDiv = document.getElementById(elementId);
        if (!qrcodeDiv) return;
        
        qrcodeDiv.innerHTML = ''; // Clear previous QR code
        if (text) {
            new QRCode(qrcodeDiv, {
                text: text,
                width: 120,
                height: 120,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('animate-fade'), 10);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Replace fullwidth colon in content
    function replaceFullwidthColon() {
        const contentEl = document.getElementById('content');
        if (contentEl) {
            contentEl.value = contentEl.value.replace(/：/g, ':');
        }
    }
    
    // Save content function
    function saveContent(button) {
        if (!button) {
            console.error('Button element not found');
            return;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const contentEl = document.getElementById('content');
        
        if (!contentEl) {
            console.error('Content element not found');
            return;
        }

        if (!isIOS) {
            contentEl.value = contentEl.value.replace(/：/g, ':');
        }
        
        const statusElem = document.getElementById('saveStatus');
        if (!statusElem) {
            console.error('Status element not found');
            return;
        }

        button.disabled = true;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            保存中...
        `;
        statusElem.textContent = '保存中...';
        statusElem.className = 'status status-warning';

        const formData = new FormData();
        formData.append('content', contentEl.value);

        fetch(window.location.href, {
            method: 'POST',
            body: formData,
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(result => {
            const now = new Date().toLocaleTimeString();
            showToast('内容保存成功', 'success');
            statusElem.textContent = `✅ 保存成功 ${now}`;
            statusElem.className = 'status status-success';
        })
        .catch(error => {
            console.error('Save error:', error);
            showToast('保存失败: ' + error.message, 'error');
            statusElem.textContent = `❌ 保存失败: ${error.message}`;
            statusElem.className = 'status status-error';
        })
        .finally(() => {
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                保存内容
            `;
            button.disabled = false;
        });
    }

    // Save config function
    function saveConfig(button) {
        if (!button) {
            console.error('Button element not found');
            return;
        }

        const statusElem = document.getElementById('configSaveStatus');
        if (!statusElem) {
            console.error('Status element not found');
            return;
        }

        button.disabled = true;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            保存中...
        `;
        statusElem.textContent = '保存中...';
        statusElem.className = 'status status-warning';

        const formData = new FormData(document.getElementById('configForm'));
        
        fetch(window.location.href, {
            method: 'POST',
            body: formData,
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(result => {
            const now = new Date().toLocaleTimeString();
            showToast('配置保存成功', 'success');
            statusElem.textContent = `✅ 配置保存成功 ${now}`;
            statusElem.className = 'status status-success';
            
            // Update page title if filename changed
            const newFilename = document.getElementById('filename').value;
            if (newFilename) {
                document.title = `${newFilename} 订阅管理面板`;
            }
        })
        .catch(error => {
            console.error('Config save error:', error);
            showToast('配置保存失败: ' + error.message, 'error');
            statusElem.textContent = `❌ 配置保存失败: ${error.message}`;
            statusElem.className = 'status status-error';
        })
        .finally(() => {
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                保存配置
            `;
            button.disabled = false;
        });
    }

    // Auto-save for content editor
    if (document.getElementById('content')) {
        let timer;
        const textarea = document.getElementById('content');
        const saveBtn = document.querySelector('#content + .btn-primary');

        if (textarea && saveBtn) {
            textarea.addEventListener('input', () => {
                clearTimeout(timer);
                const statusElem = document.getElementById('saveStatus');
                if (statusElem) {
                    statusElem.textContent = '内容已修改，5秒后自动保存...';
                    statusElem.className = 'status status-warning';
                }
                timer = setTimeout(() => {
                    saveContent(saveBtn);
                }, 5000);
            });
        }
    }
    
    // Generate QR codes for all subscription links on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Admin links
        generateQR('qrcode_0', 'https://${url.hostname}/${mytoken}?sub');
        generateQR('qrcode_1', 'https://${url.hostname}/${mytoken}?b64');
        generateQR('qrcode_2', 'https://${url.hostname}/${mytoken}?clash');
        generateQR('qrcode_3', 'https://${url.hostname}/${mytoken}?sb');
        generateQR('qrcode_4', 'https://${url.hostname}/${mytoken}?surge');
        generateQR('qrcode_5', 'https://${url.hostname}/${mytoken}?loon');
        
        // Guest links
        generateQR('guest_0', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}');
        generateQR('guest_1', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64');
        generateQR('guest_2', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash');
        generateQR('guest_3', 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb');
    });
    </script>
</body>
</html>
		`;

		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		console.error('处理请求时发生错误:', error);
		return new Response("服务器错误: " + error.message, {
			status: 500,
			headers: { "Content-Type": "text/plain;charset=utf-8" }
		});
	}
}
