import type { BlockCategory } from './types.js';

export const httpCategory: BlockCategory = {
	name: 'HTTP',
	blocks: [
		{
			id: 'http_begin',
			name: 'HTTP Begin',
			color: '#f97316',
			icon: '🌍',
			category: 'http',
			description: 'กำหนด URL เป้าหมายสำหรับ HTTP request (http.begin)',
			inputs: [
				{ id: 'in',  type: 'input', label: '➜',  dataType: 'any',    description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'url', type: 'input', label: 'URL', dataType: 'String', description: 'URL เป้าหมาย' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'http', label: 'Client', default: 'http', description: 'ชื่อตัวแปร HTTPClient' },
				{ id: 'url',     type: 'text', label: 'URL',           default: 'http://example.com/api', description: 'URL (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor, registerGlobal }) {
				registerPreprocessor('#include <HTTPClient.h>');
				const varname = params.varname ?? 'http';
				const url     = resolveInput('url') ?? `"${(params.url ?? '').replaceAll('"', '\\"')}"`;
				registerGlobal(`HTTPClient ${varname};`);
				return {
					parts: [
						[`${pad}${varname}.begin(${url});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'http_add_header',
			name: 'HTTP Add Header',
			color: '#f97316',
			icon: '🏷️',
			category: 'http',
			description: 'เพิ่ม HTTP header ก่อนส่ง request (http.addHeader)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'http', label: 'Client', default: 'http' },
				{ id: 'key',     type: 'text', label: 'Header',        default: 'Content-Type', description: 'ชื่อ header' },
				{ id: 'value',   type: 'text', label: 'Value',         default: 'application/json', description: 'ค่า header' },
			],
			toCode({ pad, params }) {
				const varname = params.varname ?? 'http';
				const key     = (params.key   ?? 'Content-Type').replaceAll('"', '\\"');
				const value   = (params.value ?? '').replaceAll('"', '\\"');
				return {
					parts: [
						[`${pad}${varname}.addHeader("${key}", "${value}");`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'http_request',
			name: 'HTTP Request',
			color: '#f97316',
			icon: '📥',
			category: 'http',
			description: 'ส่ง HTTP request คืน response code',
			inputs: [
				// { id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }
			],
			outputs: [
				{ id: 'code', type: 'output', label: 'Code',  dataType: 'int',  description: 'HTTP response code เช่น 200, 404' },
			],
			params: [
				{ id: 'varname', type: 'varname', category: 'http', label: 'Client', default: 'http' },
				{ id: 'method', type: 'option', label: 'Method', options: [
					{ label: 'GET', value: 'GET'}, 
					{ label: 'POST', value: 'POST'},
					{ label: 'PUT', value: 'PUT'}, 
					{ label: 'PATCH', value: 'PATCH'},
					{ label: 'DELETE', value: 'DELETE'}
				], default: 'GET' },
				{ id: 'body', type: 'text', label: 'Body', default: '', hidden: ({ params }) => params.method === 'GET' },
			],
			dynamicPorts({ method }) {
				if (method === 'GET') {
					return {
						inputs: [
							{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }
						]
					};
				} else {
					return {
						inputs: [
							{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
							{ id: 'body', type: 'input' as const, label: 'Body', dataType: 'String' as const }
						]
					};
				}
			},
			toCode({ pad, block, safeId, params, registerPreprocessor, resolveInput }) {
				registerPreprocessor('#include <HTTPClient.h>');
				const varname = params.varname ?? 'http';
				const method = params.method ?? 'GET';
				const escapedBody = (params.body ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
				const body = resolveInput('body') ?? `"${escapedBody}"`;
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = ${varname}.${method}(String(${method !== 'GET' ? body : ''}));`],
						{ portId: 'out',  depthDelta: 0 },
						{ portId: 'code', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'http_get_string',
			name: 'HTTP Get Response',
			color: '#f97316',
			icon: '📄',
			category: 'http',
			description: 'รับ response body เป็น String (http.getString) — เรียกหลัง GET/POST',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'body', type: 'output', label: 'Body', dataType: 'String', description: 'เนื้อหา response' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'http', label: 'Client', default: 'http' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <HTTPClient.h>');
				const varname = params.varname ?? 'http';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = ${varname}.getString();`],
						{ portId: 'body', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'http_end',
			name: 'HTTP End',
			color: '#f97316',
			icon: '🔚',
			category: 'http',
			description: 'ปิด HTTP connection และคืน resource (http.end)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'http', label: 'Client', default: 'http' },
			],
			toCode({ pad, params }) {
				const varname = params.varname ?? 'http';
				return {
					parts: [
						[`${pad}${varname}.end();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
