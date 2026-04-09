import type { BlockCategory } from './types.js';

export const webserverCategory: BlockCategory = {
	name: 'Web Server',
	blocks: [
		// ─── Setup ────────────────────────────────────────────────────────
		{
			id: 'ws_begin',
			name: 'Web Server Begin',
			color: '#22c55e',
			icon: '🌐',
			category: 'webserver',
			description: 'สร้างและเริ่ม Web Server บน port ที่กำหนด (WebServer.begin)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'port', type: 'number', label: 'Port', default: '80', description: 'port ที่ต้องการเปิด' },
			],
			toCode({ pad, params, registerPreprocessor, registerGlobal, registerPollingCode }) {
				registerPreprocessor('#include <WebServer.h>');
				const port = params.port ?? '80';
				registerGlobal(`WebServer server(${port});`);
				registerPollingCode('server.handleClient();');
				return {
					parts: [
						[`${pad}server.begin();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Route registration ───────────────────────────────────────────
		{
			id: 'ws_on',
			name: 'Web Server On',
			trigger: true,
			color: '#22c55e',
			icon: '🛣️',
			category: 'webserver',
			description: 'ลงทะเบียน handler function สำหรับ route และ HTTP method ที่กำหนด (server.on)',
			inputs: [],
			outputs: [
				{ id: 'handler', type: 'output', label: '➜', dataType: 'any', description: 'โค้ดภายใน handler function (เรียกเมื่อมี request เข้ามา)' },
			],
			params: [
				{ id: 'path', type: 'text', label: 'Path', default: '/', description: 'URL path เช่น /api/data' },
				{
					id: 'method', type: 'option', label: 'Method',
					options: [
						{ label: 'GET', value: 'HTTP_GET' },
						{ label: 'POST', value: 'HTTP_POST' },
						{ label: 'PUT', value: 'HTTP_PUT' },
						{ label: 'DELETE', value: 'HTTP_DELETE' },
						{ label: 'ANY', value: 'HTTP_ANY' },
					],
					description: 'HTTP method'
				},
			],
			toCode({ pad, block, safeId, params, captureCode, registerPreprocessor, registerFunction }) {
				registerPreprocessor('#include <WebServer.h>');
				const path = (params.path ?? '/').replaceAll('"', '\\"');
				const method = params.method ?? 'HTTP_GET';
				const fnName = `_ws_handler_${safeId(block.id)}`;
				const body = captureCode('handler', 1);
				registerFunction(`void ${fnName}()`, body, `void ${fnName}();`);
				return {
					parts: [
						[`${pad}server.on("${path}", ${method}, ${fnName});`],
					]
				};
			}
		},
		{
			id: 'ws_on_not_found',
			name: 'Web Server On Not Found',
			color: '#22c55e',
			icon: '❓',
			category: 'webserver',
			description: 'ลงทะเบียน handler สำหรับ route ที่ไม่พบ (server.onNotFound)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'out', type: 'output', label: '➜', dataType: 'void' },
				{ id: 'handler', type: 'output', label: 'Handler ➜', dataType: 'any' },
			],
			params: [
				{ id: 'varname', type: 'varname', category: 'webserver', label: 'Server var', default: 'server' },
			],
			toCode({ pad, block, safeId, params, captureCode, registerPreprocessor, registerFunction }) {
				registerPreprocessor('#include <WebServer.h>');
				const fnName = `_ws_notfound_${safeId(block.id)}`;
				const body = captureCode('handler', 1);
				registerFunction(`void ${fnName}()`, body, `void ${fnName}();`);
				return {
					parts: [
						[`${pad}server.onNotFound(${fnName});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Request info ─────────────────────────────────────────────────
		{
			id: 'ws_method',
			name: 'WS Request Method',
			color: '#22c55e',
			icon: '📋',
			category: 'webserver',
			description: 'รับ HTTP method ของ request ปัจจุบัน (server.method) เป็น int: HTTP_GET=1, HTTP_POST=3',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'method', type: 'output', label: 'Method', dataType: 'int' }],
			toCode({ pad, block, safeId, params }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = server.method();`],
						{ portId: 'method', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_uri',
			name: 'WS Request URI',
			color: '#22c55e',
			icon: '🔗',
			category: 'webserver',
			description: 'รับ URI ของ request ปัจจุบัน (server.uri)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'uri', type: 'output', label: 'URI', dataType: 'String' }],
			toCode({ pad, block, safeId, params }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = server.uri();`],
						{ portId: 'uri', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_arg',
			name: 'WS Get Arg',
			color: '#22c55e',
			icon: '🔍',
			category: 'webserver',
			description: 'รับค่า query parameter หรือ POST field จาก request (server.arg)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'String' }],
			params: [
				{ id: 'name', type: 'text', label: 'Arg name', default: 'id', description: 'ชื่อ parameter' },
			],
			toCode({ pad, block, safeId, params }) {
				const name = (params.name ?? 'id').replaceAll('"', '\\"');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = server.arg("${name}");`],
						{ portId: 'value', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_has_arg',
			name: 'WS Has Arg',
			color: '#22c55e',
			icon: '❔',
			category: 'webserver',
			description: 'ตรวจสอบว่า request มี parameter ชื่อที่กำหนดหรือไม่ (server.hasArg)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'result', type: 'output', label: 'Has', dataType: 'bool' }],
			params: [
				{ id: 'name', type: 'text', label: 'Arg name', default: 'id' },
			],
			toCode({ pad, block, safeId, params }) {
				const name = (params.name ?? 'id').replaceAll('"', '\\"');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}bool ${id} = server.hasArg("${name}");`],
						{ portId: 'result', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_body',
			name: 'WS Request Body',
			color: '#22c55e',
			icon: '📄',
			category: 'webserver',
			description: 'รับ body ของ POST/PUT request เป็น String (server.arg("plain"))',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'body', type: 'output', label: 'Body', dataType: 'String' }],
			toCode({ pad, block, safeId, params }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = server.arg("plain");`],
						{ portId: 'body', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Response ─────────────────────────────────────────────────────
		{
			id: 'ws_send',
			name: 'WS Send',
			color: '#22c55e',
			icon: '📤',
			category: 'webserver',
			description: 'ส่ง HTTP response พร้อม status code, content type และ body (server.send)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'body', type: 'input', label: 'Body', dataType: 'String', description: 'เนื้อหา response' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'code', type: 'number', label: 'Status Code', default: '200' },
				{ id: 'content_type', type: 'text', label: 'Content-Type', default: 'text/plain' },
				{ id: 'body', type: 'text', label: 'Body', default: 'OK', description: 'ใช้เมื่อไม่มีบล็อกต่อเข้ามา' },
			],
			toCode({ pad, params, resolveInput }) {
				const code = params.code ?? '200';
				const ct = (params.content_type ?? 'text/plain').replaceAll('"', '\\"');
				const body = resolveInput('body') ?? `"${(params.body ?? 'OK').replaceAll('"', '\\"')}"`;
				return {
					parts: [
						[`${pad}server.send(${code}, "${ct}", ${body});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_send_header',
			name: 'WS Send Header',
			color: '#22c55e',
			icon: '🏷️',
			category: 'webserver',
			description: 'เพิ่ม response header ก่อน sendContent (server.sendHeader)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'key', type: 'text', label: 'Header', default: 'Access-Control-Allow-Origin' },
				{ id: 'value', type: 'text', label: 'Value', default: '*' },
			],
			toCode({ pad, params }) {
				const key = (params.key ?? '').replaceAll('"', '\\"');
				const value = (params.value ?? '').replaceAll('"', '\\"');
				return {
					parts: [
						[`${pad}server.sendHeader("${key}", "${value}");`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_set_chunked',
			name: 'WS Send Content Begin',
			color: '#22c55e',
			icon: '📡',
			category: 'webserver',
			description: 'เริ่มส่ง response แบบ chunked streaming (setContentLength → sendContent)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'code', type: 'number', label: 'Status Code', default: '200' },
				{ id: 'content_type', type: 'text', label: 'Content-Type', default: 'text/html' },
			],
			toCode({ pad, params }) {
				const code = params.code ?? '200';
				const ct = (params.content_type ?? 'text/html').replaceAll('"', '\\"');
				return {
					parts: [
						[
							`${pad}server.setContentLength(CONTENT_LENGTH_UNKNOWN);`,
							`${pad}server.send(${code}, "${ct}", "");`,
						],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'ws_send_content',
			name: 'WS Send Content',
			color: '#22c55e',
			icon: '📨',
			category: 'webserver',
			description: 'ส่งข้อมูล chunk ในโหมด chunked streaming (server.sendContent)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data', dataType: 'String', description: 'ข้อมูลที่จะส่ง' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'data', type: 'text', label: 'Data', default: '', description: 'ใช้เมื่อไม่มีบล็อกต่อเข้ามา' },
			],
			toCode({ pad, params, resolveInput }) {
				const data = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;
				return {
					parts: [
						[`${pad}server.sendContent(${data});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
	]
};
