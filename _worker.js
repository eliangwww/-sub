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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

            :root {
                --bg-color: #1a1a2e; /* Deeper space blue */
                --main-color: rgba(27, 27, 46, 0.7); /* Translucent deeper blue */
                --text-color: #e0e0e0; /* Softer white */
                --heading-color: #ffffff;
                --link-color: #00bcd4; /* Brighter cyan */
                --link-hover: #4dd0e1;
                --border-color: rgba(255, 255, 255, 0.1);
                --card-bg: rgba(255, 255, 255, 0.05); /* Lighter translucent for cards */
                --card-border: rgba(255, 255, 255, 0.15);
                --summary-bg: rgba(255, 255, 255, 0.08);
                --summary-hover: rgba(255, 255, 255, 0.12);
                --btn-bg: #28a745; /* Success green */
                --btn-hover: #218838;
                --input-bg: rgba(0, 0, 0, 0.2);
                --input-border: rgba(255, 255, 255, 0.2);
                --animation-speed: 0.3s;
                --toast-bg-success: #28a745;
                --toast-bg-error: #dc3545;
                --toast-bg-info: #17a2b8;
                --toast-text-color: #ffffff;
            }
            body {
                background-image: url('https://api.imlcd.cn/bg/gq.php');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
                color: var(--text-color);
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 20px;
                font-size: 15px;
                line-height: 1.6;
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
                background: var(--main-color);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                border: 1px solid var(--border-color);
                transition: transform 0.3s ease;
            }
            h1 {
                text-align: center;
                color: var(--heading-color);
                border-bottom: 2px solid var(--border-color);
                padding-bottom: 15px;
                margin-bottom: 30px;
                font-weight: 700;
            }
            details {
                background: var(--card-bg);
                margin-bottom: 15px;
                border-radius: 10px;
                border: 1px solid var(--card-border);
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            summary {
                padding: 15px 20px;
                background: var(--summary-bg);
                font-weight: 600;
                cursor: pointer;
                border-radius: 10px;
                transition: background 0.3s ease, border-radius 0.3s ease;
                list-style: none; /* Hide default triangle */
                display: flex;
                align-items: center;
                gap: 10px;
            }
            summary .fa-chevron-right { /* Style for the arrow icon */
                transition: transform var(--animation-speed) ease;
            }
            details[open] > summary .fa-chevron-right {
                transform: rotate(90deg);
            }
            details[open] > summary {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }
            summary:hover {
                background: var(--summary-hover);
            }
            .content-wrapper {
                overflow: hidden;
                transition: max-height var(--animation-speed) ease-out;
                max-height: 0;
            }
            details[open] .content-wrapper {
                max-height: 1000px; /* Adjusted */
                transition: max-height var(--animation-speed) ease-in;
                padding: 15px 20px;
                border-top: 1px solid var(--border-color);
            }
            a {
                color: var(--link-color);
                text-decoration: none;
                transition: color 0.3s ease;
            }
            a:hover {
                color: var(--link-hover);
                text-decoration: underline;
            }
            strong {
                color: var(--link-color);
            }
            .subscription-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-top: 10px;
            }
            .subscription-link {
                background: rgba(0,0,0,0.1);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                word-break: break-all;
            }
            .subscription-link strong {
                display: block;
                margin-bottom: 8px;
                font-size: 1.1em;
            }
            .qr-code {
                margin-top: 15px;
                padding: 10px;
                background: white;
                border-radius: 5px;
                display: inline-block;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .editor {
                width: 100%;
                min-height: 350px;
                margin: 15px 0;
                padding: 15px;
                box-sizing: border-box;
                border: 1px solid var(--input-border);
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.6;
                overflow-y: auto;
                resize: vertical;
                background: var(--input-bg);
                color: var(--text-color);
                font-family: 'Fira Code', 'Cascadia Code', 'Courier New', monospace; /* More modern code fonts */
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
            }
            .save-container {
                margin-top: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
                flex-wrap: wrap; /* Allow wrapping on small screens */
            }
            .save-btn {
                padding: 10px 25px;
                color: var(--toast-text-color);
                background: var(--btn-bg);
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.3s ease, transform 0.2s ease;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .save-btn:hover:not(:disabled) {
                background: var(--btn-hover);
                transform: translateY(-2px);
            }
            .save-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
                opacity: 0.8;
            }
            .save-status {
                font-size: 14px;
                font-weight: 600;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 13px;
                color: #b0b0b0;
                border-top: 1px solid var(--border-color);
                padding-top: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--heading-color);
            }
            .form-group input[type="text"] {
                width: calc(100% - 30px); /* Adjusted for padding and border */
                padding: 12px 15px;
                border: 1px solid var(--input-border);
                border-radius: 6px;
                background: var(--input-bg);
                color: var(--text-color);
                font-size: 15px;
                box-sizing: border-box;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
            }
            .form-group input[type="text"]:focus {
                border-color: var(--link-color);
                outline: none;
                box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.25);
            }

            /* Toast Notification Styles */
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            .toast {
                background-color: var(--toast-bg-info);
                color: var(--toast-text-color);
                padding: 10px 20px;
                border-radius: 5px;
                margin-bottom: 10px;
                opacity: 0;
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                transform: translateX(100%);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                min-width: 200px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            .toast.hide {
                opacity: 0;
                transform: translateX(100%);
            }
            .toast.success { background-color: var(--toast-bg-success); }
            .toast.error { background-color: var(--toast-bg-error); }
            .toast.info { background-color: var(--toast-bg-info); } /* Ensure info has a background */
            .toast i {
                font-size: 1.2em;
            }

            /* Responsive Adjustments */
            @media (max-width: 768px) {
                .container {
                    padding: 15px;
                    margin: 10px;
                }
                h1 {
                    font-size: 1.8em;
                }
                summary {
                    font-size: 1em;
                }
                .subscription-grid {
                    grid-template-columns: 1fr; /* Stack on smaller screens */
                }
                .save-container {
                    flex-direction: column;
                    align-items: stretch;
                }
                .save-btn {
                    width: 100%;
                    justify-content: center;
                }
                .form-group input[type="text"] {
                    width: calc(100% - 20px);
                }
            }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
    </head>
    <body>
        <div id="toast-container"></div>

        <div class="container">
            <h1>${currentSettings.fileName} 订阅管理面板</h1>
            
            <details open>
                <summary><i class="fas fa-chevron-right"></i> <i class="fas fa-star"></i> 管理员订阅 (Admin Links)</summary>
                <div class="content-wrapper">
                    <div class="subscription-grid">
                        <div class="subscription-link">
                            <strong>自适应订阅:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}', 'qrcode_0', '自适应订阅')">https://${url.hostname}/${mytoken}</a>
                            <div class="qr-code" id="qrcode_0"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Base64:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}?b64', 'qrcode_1', 'Base64订阅')">https://${url.hostname}/${mytoken}?b64</a>
                            <div class="qr-code" id="qrcode_1"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Clash:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}?clash', 'qrcode_2', 'Clash订阅')">https://${url.hostname}/${mytoken}?clash</a>
                            <div class="qr-code" id="qrcode_2"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Sing-Box:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}?sb', 'qrcode_3', 'Sing-Box订阅')">https://${url.hostname}/${mytoken}?sb</a>
                            <div class="qr-code" id="qrcode_3"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Surge:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}?surge', 'qrcode_4', 'Surge订阅')">https://${url.hostname}/${mytoken}?surge</a>
                            <div class="qr-code" id="qrcode_4"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Loon:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/${mytoken}?loon', 'qrcode_5', 'Loon订阅')">https://${url.hostname}/${mytoken}?loon</a>
                            <div class="qr-code" id="qrcode_5"></div>
                        </div>
                    </div>
                </div>
            </details>

            <details>
                <summary><i class="fas fa-chevron-right"></i> <i class="fas fa-user-friends"></i> 访客订阅 (Guest Links)</summary>
                <div class="content-wrapper">
                    <p>访客订阅仅可用于客户端获取节点，无法访问此管理页面。<br>访客TOKEN: <strong>${currentSettings.guestToken}</strong></p>
                    <div class="subscription-grid">
                        <div class="subscription-link">
                            <strong>自适应订阅:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/sub?token=${currentSettings.guestToken}', 'guest_0', '访客自适应订阅')">https://${url.hostname}/sub?token=${currentSettings.guestToken}</a>
                            <div class="qr-code" id="guest_0"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Base64:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64', 'guest_1', '访客Base64订阅')">https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64</a>
                            <div class="qr-code" id="guest_1"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Clash:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash', 'guest_2', '访客Clash订阅')">https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash</a>
                            <div class="qr-code" id="guest_2"></div>
                        </div>
                        <div class="subscription-link">
                            <strong>Sing-Box:</strong><br>
                            <a href="javascript:void(0)" onclick="copyAndGenerateQR('https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb', 'guest_3', '访客Sing-Box订阅')">https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb</a>
                            <div class="qr-code" id="guest_3"></div>
                        </div>
                    </div>
                </div>
            </details>

            <details open>
                <summary><i class="fas fa-chevron-right"></i> <i class="fas fa-cog"></i> 订阅转换配置 & Telegram (Converter Config & TG)</summary>
                <div class="content-wrapper">
                    ${hasKV ? `
                    <form id="configForm">
                        <div class="form-group">
                            <label for="subapi"><i class="fas fa-globe"></i> 订阅转换后端 (SUBAPI):</label>
                            <input type="text" id="subapi" name="subapi" value="${currentSettings.subApi}" placeholder="e.g., SUBAPI.cmliussss.net">
                        </div>
                        <div class="form-group">
                            <label for="subconfig"><i class="fas fa-file-alt"></i> 订阅转换配置 (SUBCONFIG):</label>
                            <input type="text" id="subconfig" name="subconfig" value="${currentSettings.subConfig}" placeholder="e.g., https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini">
                        </div>
                        <div class="form-group">
                            <label for="tgtoken"><i class="fab fa-telegram-plane"></i> Telegram Bot Token (TG TOKEN):</label>
                            <input type="text" id="tgtoken" name="tgtoken" value="${currentSettings.tgToken}" placeholder="Optional: Your Telegram Bot Token">
                        </div>
                        <div class="form-group">
                            <label for="tgid"><i class="fas fa-comments"></i> Telegram Chat ID (TG ID):</label>
                            <input type="text" id="tgid" name="tgid" value="${currentSettings.tgId}" placeholder="Optional: Your Telegram Chat ID">
                        </div>
                        <div class="form-group">
                            <label for="filename"><i class="fas fa-file-signature"></i> 文件名 (SUBNAME):</label>
                            <input type="text" id="filename" name="filename" value="${currentSettings.fileName}" placeholder="e.g., CF-Workers-SUB">
                        </div>
                        <div class="form-group">
                            <label for="url302"><i class="fas fa-external-link-alt"></i> 302重定向URL (URL302):</label>
                            <input type="text" id="url302" name="url302" value="${currentSettings.url302}" placeholder="Optional: https://example.com">
                        </div>
                         <div class="form-group">
                            <label for="guesttoken"><i class="fas fa-user-secret"></i> 访客TOKEN (GUESTTOKEN):</label>
                            <input type="text" id="guesttoken" name="guesttoken" value="${currentSettings.guestToken}" placeholder="Optional: auto or UUID">
                        </div>
                        <div class="save-container">
                            <button class="save-btn" type="button" onclick="saveConfig(this)">
                                <i class="fas fa-save"></i> 保存配置
                            </button>
                            <span class="save-status" id="configSaveStatus"></span>
                        </div>
                    </form>
                    ` : '<p>请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                </div>
            </details>

            <details open>
                <summary><i class="fas fa-chevron-right"></i> <i class="fas fa-edit"></i> 订阅列表编辑 (Editor)</summary>
                <div class="content-wrapper">
                    ${hasKV ? `
                    <textarea class="editor" 
                        placeholder="在此输入或粘贴节点和订阅链接，每行一个..."
                        id="content" name="content">${content}</textarea>
                    <div class="save-container">
                        <button class="save-btn" type="button" onclick="saveContent(this)">
                            <i class="fas fa-save"></i> 保存内容
                        </button>
                        <span class="save-status" id="saveStatus"></span>
                    </div>
                    ` : '<p>请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
                </div>
            </details>
            
            <div class="footer">
                <p>
                    <a href="https://github.com/cmliu/CF-Workers-SUB" target="_blank"><i class="fab fa-github"></i> GitHub Project</a> | 
                    <a href="https://t.me/CMLiussss" target="_blank"><i class="fab fa-telegram"></i> Telegram Channel</a>
                </p>
                <p>User-Agent: ${request.headers.get('User-Agent')}</p>
            </div>
        </div>

        <script>
            // Pass mytoken from worker to frontend JS
            const mytoken = '${mytoken}'; 

            function showToast(message, type = 'info', duration = 3000) {
                const toastContainer = document.getElementById('toast-container');
                const toast = document.createElement('div');
                toast.classList.add('toast', type);
                
                let iconHtml = '';
                if (type === 'success') iconHtml = '<i class="fas fa-check-circle"></i>';
                else if (type === 'error') iconHtml = '<i class="fas fa-times-circle"></i>';
                else iconHtml = '<i class="fas fa-info-circle"></i>'; // Default info icon

                toast.innerHTML = \`\${iconHtml} \${message}\`;
                toastContainer.appendChild(toast);

                // Force reflow for animation
                void toast.offsetWidth; 

                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                    toast.classList.add('hide');
                    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                }, duration);
            }

            function generateQrCode(text, qrcodeId) {
                const qrcodeDiv = document.getElementById(qrcodeId);
                if (qrcodeDiv) {
                    qrcodeDiv.innerHTML = ''; // Clear previous QR code
                    if (text) {
                        // Ensure QRCode library is loaded before use
                        if (typeof QRCode !== 'undefined') {
                            new QRCode(qrcodeDiv, {
                                text: text,
                                width: 120,
                                height: 120,
                                colorDark: "#000000",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel.H
                            });
                        } else {
                            console.error('QRCode library is not loaded.');
                        }
                    }
                }
            }

            function copyAndGenerateQR(text, qrcodeId, typeName) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast(\`\${typeName}链接已复制到剪贴板！\`, 'success');
                    generateQrCode(text, qrcodeId); // Regenerate QR code on copy click if needed
                }).catch(err => {
                    console.error('复制失败:', err);
                    showToast(\`复制\${typeName}链接失败，请手动复制！\`, 'error');
                });
            }
                
            function replaceFullwidthColon() {
                const textarea = document.getElementById('content');
                if (textarea) {
                    textarea.value = textarea.value.replace(/：/g, ':');
                }
            }
            
            async function saveContent(button) {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                if (!isIOS) {
                    replaceFullwidthColon();
                }
                
                const statusElem = document.getElementById('saveStatus');
                button.disabled = true;
                const originalButtonHtml = button.innerHTML; // Store original content
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...'; // Loading animation
                statusElem.textContent = ''; // Clear previous status
                statusElem.style.color = '#f1c40f'; // Yellow for saving

                const formData = new FormData();
                formData.append('content', document.getElementById('content').value);

                try {
                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        body: formData,
                        cache: 'no-cache'
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(\`HTTP error! status: \${response.status} - \${errorText}\`);
                    }
                    
                    const now = new Date().toLocaleTimeString();
                    document.title = \`保存成功 \${now}\`;
                    statusElem.textContent = \`✅ 保存成功 at \${now}\`;
                    statusElem.style.color = '#2ecc71';
                    showToast('订阅内容已保存成功！', 'success');

                } catch (error) {
                    console.error('Save error:', error);
                    statusElem.textContent = \`❌ 保存失败: \${error.message}\`;
                    statusElem.style.color = '#e74c3c';
                    showToast(\`订阅内容保存失败: \${error.message}\`, 'error');
                } finally {
                    button.innerHTML = originalButtonHtml; // Restore original content
                    button.disabled = false;
                    setTimeout(() => statusElem.textContent = '', 3000);
                }
            }

            async function saveConfig(button) {
                const statusElem = document.getElementById('configSaveStatus');
                button.disabled = true;
                const originalButtonHtml = button.innerHTML; // Store original content
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...'; // Loading animation
                statusElem.textContent = ''; // Clear previous status
                statusElem.style.color = '#f1c40f'; // Yellow for saving

                const formData = new FormData(document.getElementById('configForm'));
                
                try {
                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        body: formData,
                        cache: 'no-cache'
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(\`HTTP error! status: \${response.status} - \${errorText}\`);
                    }
                    
                    const now = new Date().toLocaleTimeString();
                    // Update the page title with the new filename immediately if it changed
                    const newFileName = document.getElementById('filename').value;
                    if (newFileName) {
                        document.title = \`\${newFileName} 订阅管理面板\`;
                    }
                    
                    statusElem.textContent = \`✅ 配置保存成功 at \${now}\`;
                    statusElem.style.color = '#2ecc71';
                    showToast('配置已保存成功！', 'success');

                } catch (error) {
                    console.error('Config save error:', error);
                    statusElem.textContent = \`❌ 配置保存失败: \${error.message}\`;
                    statusElem.style.color = '#e74c3c';
                    showToast(\`配置保存失败: \${error.message}\`, 'error');
                } finally {
                    button.innerHTML = originalButtonHtml; // Restore original content
                    button.disabled = false;
                    setTimeout(() => statusElem.textContent = '', 3000);
                }
            }

            // Auto-generate all QR codes on page load
            document.addEventListener('DOMContentLoaded', () => {
                const adminLinks = [
                    { id: 'qrcode_0', url: 'https://${url.hostname}/${mytoken}' },
                    { id: 'qrcode_1', url: 'https://${url.hostname}/${mytoken}?b64' },
                    { id: 'qrcode_2', url: 'https://${url.hostname}/${mytoken}?clash' },
                    { id: 'qrcode_3', url: 'https://${url.hostname}/${mytoken}?sb' },
                    { id: 'qrcode_4', url: 'https://${url.hostname}/${mytoken}?surge' },
                    { id: 'qrcode_5', url: 'https://${url.hostname}/${mytoken}?loon' }
                ];
                adminLinks.forEach(link => generateQrCode(link.url, link.id));

                // Only generate guest QR codes if guestToken is not empty
                const guestTokenValue = '${currentSettings.guestToken}'; // Get the actual value
                if (guestTokenValue && guestTokenValue !== 'auto' && guestTokenValue !== 'null' && guestTokenValue !== 'undefined') {
                    const guestLinks = [
                        { id: 'guest_0', url: 'https://${url.hostname}/sub?token=${currentSettings.guestToken}' },
                        { id: 'guest_1', url: 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&b64' },
                        { id: 'guest_2', url: 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&clash' },
                        { id: 'guest_3', url: 'https://${url.hostname}/sub?token=${currentSettings.guestToken}&sb' }
                    ];
                    guestLinks.forEach(link => generateQrCode(link.url, link.id));
                }


                // Auto-save for content editor
                const contentTextarea = document.getElementById('content');
                if (contentTextarea) {
                    let timer;
                    contentTextarea.addEventListener('input', () => {
                        clearTimeout(timer);
                        const statusElem = document.getElementById('saveStatus');
                        statusElem.textContent = '内容已修改，5秒后自动保存...';
                        statusElem.style.color = '#f1c40f';
                        timer = setTimeout(() => saveContent(document.querySelector('#content + .save-container .save-btn')), 5000);
                    });
                }
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
