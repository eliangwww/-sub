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

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

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
					return await KV(request, env, 'LINK.txt', 访客订阅);
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
			if (userAgent.includes('null') || userAgent.includes('subconverter') || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase())) {
				订阅格式 = 'base64';
			} else if (userAgent.includes('clash') || (url.searchParams.has('clash') && !userAgent.includes('subconverter'))) {
				订阅格式 = 'clash';
			} else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || ((url.searchParams.has('sb') || url.searchParams.has('singbox')) && !userAgent.includes('subconverter'))) {
				订阅格式 = 'singbox';
			} else if (userAgent.includes('surge') || (url.searchParams.has('surge') && !userAgent.includes('subconverter'))) {
				订阅格式 = 'surge';
			} else if (userAgent.includes('quantumult%20x') || (url.searchParams.has('quanx') && !userAgent.includes('subconverter'))) {
				订阅格式 = 'quanx';
			} else if (userAgent.includes('loon') || (url.searchParams.has('loon') && !userAgent.includes('subconverter'))) {
				订阅格式 = 'loon';
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
			const result = [...uniqueLines].join('\n');
			//console.log(result);

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

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"Profile-Update-Interval": `${SUBUpdateTime}`,
						//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
					}
				});
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
				const subConverterResponse = await fetch(subConverterUrl);

				if (!subConverterResponse.ok) {
					return new Response(base64Data, {
						headers: {
							"content-type": "text/plain; charset=utf-8",
							"Profile-Update-Interval": `${SUBUpdateTime}`,
							//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
						}
					});
					//throw new Error(`Error fetching subConverterUrl: ${subConverterResponse.status} ${subConverterResponse.statusText}`);
				}
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				return new Response(subConverterContent, {
					headers: {
						"Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`,
						"content-type": "text/plain; charset=utf-8",
						"Profile-Update-Interval": `${SUBUpdateTime}`,
						//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,

					},
				});
			} catch (error) {
				return new Response(base64Data, {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"Profile-Update-Interval": `${SUBUpdateTime}`,
						//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
					}
				});
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

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	try {
		// POST request handling remains the same
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
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
						:root {
							--bg-color: #2c3e50;
							--main-color: rgba(52, 73, 94, 0.85); /* Added transparency */
							--text-color: #ecf0f1;
							--link-color: #3498db;
							--link-hover: #5dade2;
							--border-color: #4a627a;
							--summary-bg: #4a627a;
							--summary-hover: #5c7a99;
							--btn-bg: #27ae60;
							--btn-hover: #2ecc71;
							--animation-speed: 0.3s; /* Animation speed variable */
						}
						body {
							/* --- Background Image Added --- */
							background-image: url('https://api.imlcd.cn/bg/gq.php');
							background-size: cover;
							background-position: center;
							background-attachment: fixed;
							/* --- End Background --- */
							color: var(--text-color);
							font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
							margin: 0;
							padding: 20px;
							font-size: 14px;
							line-height: 1.6;
						}
						.container {
							max-width: 800px;
							margin: 0 auto;
							background: var(--main-color);
							/* --- Glassmorphism Effect --- */
							backdrop-filter: blur(10px);
							-webkit-backdrop-filter: blur(10px);
							/* --- End Effect --- */
							padding: 20px;
							border-radius: 10px;
							box-shadow: 0 10px 30px rgba(0,0,0,0.3);
							border: 1px solid rgba(255, 255, 255, 0.2);
						}
						h1 {
							text-align: center;
							color: var(--text-color);
							border-bottom: 2px solid var(--border-color);
							padding-bottom: 10px;
							margin-bottom: 20px;
						}
						details {
							background: rgba(0,0,0,0.1);
							margin-bottom: 10px;
							border-radius: 5px;
							border: 1px solid var(--border-color);
							overflow: hidden; /* Important for animation */
						}
						summary {
							padding: 12px 15px;
							background: var(--summary-bg);
							font-weight: bold;
							cursor: pointer;
							border-radius: 5px;
							transition: background 0.3s ease;
							list-style: none; /* Hide default marker */
						}
						summary::-webkit-details-marker {
							display: none;
						}
						summary:hover {
							background: var(--summary-hover);
						}
						details[open] > summary {
							border-bottom-left-radius: 0;
							border-bottom-right-radius: 0;
						}
						.content-wrapper {
							padding: 0 15px;
							max-height: 0;
							opacity: 0;
							overflow: hidden;
							transition: max-height var(--animation-speed) ease-in-out,
										opacity var(--animation-speed) ease-in-out,
										padding var(--animation-speed) ease-in-out;
						}
						details[open] .content-wrapper {
							max-height: 1000px; /* Adjust if content is taller */
							opacity: 1;
							padding: 15px;
						}
						a {
							color: var(--link-color);
							text-decoration: none;
						}
						a:hover {
							color: var(--link-hover);
							text-decoration: underline;
						}
						strong {
							color: var(--link-color);
						}
						.subscription-link {
							margin-bottom: 15px;
						}
						.qr-code {
							margin-top: 10px;
							padding: 10px;
							background: white;
							border-radius: 5px;
							display: inline-block;
							line-height: 0; /* Fix extra space issue */
						}
						.editor {
							width: 100%;
							height: 350px;
							margin: 15px 0;
							padding: 10px;
							box-sizing: border-box;
							border: 1px solid var(--border-color);
							border-radius: 4px;
							font-size: 14px;
							line-height: 1.5;
							overflow-y: auto;
							resize: vertical;
							background: #283747;
							color: var(--text-color);
							font-family: 'Courier New', Courier, monospace;
						}
						.save-container {
							margin-top: 8px;
							display: flex;
							align-items: center;
							gap: 10px;
						}
						.save-btn {
							padding: 8px 18px;
							color: white;
							background: var(--btn-bg);
							border: none;
							border-radius: 4px;
							cursor: pointer;
							transition: background 0.3s ease;
						}
						.save-btn:hover {
							background: var(--btn-hover);
						}
						.footer {
							margin-top: 20px;
							text-align: center;
							font-size: 12px;
							color: #bdc3c7;
							border-top: 1px solid var(--border-color);
							padding-top: 15px;
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
								<div class="subscription-link">
									<strong>自适应订阅:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}" data-qrcode-id="qrcode_0">https://${url.hostname}/${mytoken}</a>
									<div class="qr-code" id="qrcode_0"></div>
								</div>
								<div class="subscription-link">
									<strong>Base64:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}?b64" data-qrcode-id="qrcode_1">https://${url.hostname}/${mytoken}?b64</a>
									<div class="qr-code" id="qrcode_1"></div>
								</div>
								<div class="subscription-link">
									<strong>Clash:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}?clash" data-qrcode-id="qrcode_2">https://${url.hostname}/${mytoken}?clash</a>
									<div class="qr-code" id="qrcode_2"></div>
								</div>
								<div class="subscription-link">
									<strong>Sing-Box:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}?sb" data-qrcode-id="qrcode_3">https://${url.hostname}/${mytoken}?sb</a>
									<div class="qr-code" id="qrcode_3"></div>
								</div>
								<div class="subscription-link">
									<strong>Surge:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}?surge" data-qrcode-id="qrcode_4">https://${url.hostname}/${mytoken}?surge</a>
									<div class="qr-code" id="qrcode_4"></div>
								</div>
								<div class="subscription-link">
									<strong>Loon:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/${mytoken}?loon" data-qrcode-id="qrcode_5">https://${url.hostname}/${mytoken}?loon</a>
									<div class="qr-code" id="qrcode_5"></div>
								</div>
							</div>
						</details>

						<details>
							<summary>😎 访客订阅 (Guest Links)</summary>
							<div class="content-wrapper">
								<p>访客订阅仅可用于客户端获取节点，无法访问此管理页面。<br>访客TOKEN: <strong>${guest}</strong></p>
								<div class="subscription-link">
									<strong>自适应订阅:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/sub?token=${guest}" data-qrcode-id="guest_0">https://${url.hostname}/sub?token=${guest}</a>
									<div class="qr-code" id="guest_0"></div>
								</div>
								<div class="subscription-link">
									<strong>Base64:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/sub?token=${guest}&b64" data-qrcode-id="guest_1">https://${url.hostname}/sub?token=${guest}&b64</a>
									<div class="qr-code" id="guest_1"></div>
								</div>
								<div class="subscription-link">
									<strong>Clash:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/sub?token=${guest}&clash" data-qrcode-id="guest_2">https://${url.hostname}/sub?token=${guest}&clash</a>
									<div class="qr-code" id="guest_2"></div>
								</div>
								<div class="subscription-link">
									<strong>Sing-Box:</strong><br>
									<a href="javascript:void(0)" onclick="copyToClipboard(this.dataset.url)" data-url="https://${url.hostname}/sub?token=${guest}&sb" data-qrcode-id="guest_3">https://${url.hostname}/sub?token=${guest}&sb</a>
									<div class="qr-code" id="guest_3"></div>
								</div>
							</div>
						</details>

						<details>
							<summary>⚙️ 订阅转换配置 (Converter Config)</summary>
							<div class="content-wrapper">
								<p>订阅转换后端 (SUBAPI): <strong>${subProtocol}://${subConverter}</strong></p>
								<p>订阅转换配置 (SUBCONFIG): <strong>${subConfig}</strong></p>
							</div>
						</details>

						<details open>
							<summary>📝 订阅列表编辑 (Editor)</summary>
							<div class="content-wrapper">
								${hasKV ? `
								<textarea class="editor" 
									placeholder="在此输入或粘贴节点和订阅链接，每行一个..."
									id="content">${content}</textarea>
								<div class="save-container">
									<button class="save-btn" onclick="saveContent(this)">保存内容</button>
									<span class="save-status" id="saveStatus"></span>
								</div>
								` : '<p>请在Cloudflare后台为此Worker绑定一个KV命名空间，变量名为 <strong>KV</strong></p>'}
							</div>
						</details>
						
						<div class="footer">
							<p>
								<a href="https://github.com/cmliu/CF-Workers-SUB" target="_blank">GitHub Project</a> | 
								<a href="https://t.me/CMLiussss" target="_blank">Telegram Channel</a>
							</p>
							<p>User-Agent: ${request.headers.get('User-Agent')}</p>
						</div>
					</div>

					<script>
					// --- MODIFIED SCRIPT LOGIC ---

					// Function to copy text and provide feedback
					function copyToClipboard(text) {
						navigator.clipboard.writeText(text).then(() => {
							alert('已复制到剪贴板');
						}).catch(err => {
							console.error('复制失败:', err);
							alert('复制失败，请手动复制');
						});
					}
					
					// Function to generate a QR code
					function generateQRCode(elementId, text) {
						const qrcodeDiv = document.getElementById(elementId);
						if (qrcodeDiv) {
							qrcodeDiv.innerHTML = ''; // Clear previous QR code
							new QRCode(qrcodeDiv, {
								text: text,
								width: 150,
								height: 150,
								colorDark: "#000000",
								colorLight: "#ffffff",
								correctLevel: QRCode.CorrectLevel.H
							});
						}
					}

					// Generate all QR codes once the page content is loaded
					window.addEventListener('DOMContentLoaded', (event) => {
						const links = document.querySelectorAll('a[data-qrcode-id]');
						links.forEach(link => {
							const url = link.dataset.url;
							const qrcodeId = link.dataset.qrcodeId;
							if (url && qrcodeId) {
								generateQRCode(qrcodeId, url);
							}
						});
					});

					// Logic for the editor section
					if (document.querySelector('.editor')) {
						let timer;
						const textarea = document.getElementById('content');
		
						function replaceFullwidthColon() {
							const text = textarea.value;
							textarea.value = text.replace(/：/g, ':');
						}
						
						function saveContent(button) {
							const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
							if (!isIOS) {
								replaceFullwidthColon();
							}
							
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
		
						textarea.addEventListener('input', () => {
							clearTimeout(timer);
							const statusElem = document.getElementById('saveStatus');
							statusElem.textContent = '内容已修改，5秒后自动保存...';
							statusElem.style.color = '#f1c40f';
							timer = setTimeout(() => saveContent(document.querySelector('.save-btn')), 5000);
						});
					}
					<\/script>
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
