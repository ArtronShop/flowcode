import type { BlockCategory } from './types.js';

export const tcpCategory: BlockCategory = {
	name: 'TCP',
	blocks: [
		{
			id: 'tcp_connect',
			name: 'TCP Connect',
			color: '#ec4899',
			icon: '🔗',
			category: 'tcp',
			description: 'เชื่อมต่อ TCP ไปยัง server ที่กำหนด (client.connect)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'host', type: 'input', label: 'Host', dataType: 'String', description: 'IP address หรือ hostname ของ server' },
			],
			outputs: [
				{ id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'หากเชื่อมต่อสำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'หากเชื่อมต่อไม่สำเร็จ' },
			],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient', description: 'ชื่อตัวแปร WiFiClient' },
				{ id: 'host', type: 'text', label: 'Host / IP', default: '192.168.1.1', description: 'Server address (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{ id: 'port', type: 'number', label: 'Port', default: '80' },
			],
			toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor, registerGlobal }) {
				registerPreprocessor('#include <WiFi.h>');
				const varname = params.varname ?? 'tcpClient';
				const host = resolveInput('host') ?? `"${(params.host ?? '192.168.1.1').replaceAll('"', '\\"')}"`;
				const port = params.port ?? '80';
				const id = safeId(block.id);
				registerGlobal(`WiFiClient ${varname};`);
				return {
					parts: [
						[`${pad}if (${varname}.connect(${host}, ${port})) {`],
						{ portId: 'ok', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
					]
				};
			}
		},
		{
			id: 'tcp_is_connected',
			name: 'TCP Is Connected',
			color: '#ec4899',
			icon: '✅',
			category: 'tcp',
			description: 'ตรวจสอบว่า TCP ยังเชื่อมต่ออยู่หรือไม่ (client.connected)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'connected', type: 'output', label: 'Connected', dataType: 'void', description: 'ถ้ายังเชื่อมต่ออยู่' },
				{ id: 'disconnect', type: 'output', label: 'Disconnect', dataType: 'void', description: 'ถ้าเลิกเชื่อมต่อแล้ว' }
			],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'tcpClient';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}if (${varname}.connected()) {`],
						{ portId: 'connected', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'disconnect', depthDelta: 1 },
						[`${pad}}`],
					]
				};
			}
		},
		{
			id: 'tcp_send',
			name: 'TCP Send',
			color: '#ec4899',
			icon: '📤',
			category: 'tcp',
			description: 'ส่งข้อมูล String ผ่าน TCP connection (client.print)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data', dataType: 'String', description: 'ข้อมูลที่ต้องการส่ง' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
				{ id: 'data', type: 'text', label: 'Data', default: '', description: 'ข้อมูล (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{
					id: 'newline', type: 'option', label: 'New line',
					options: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }],
				},
			],
			toCode({ pad, params, resolveInput }) {
				const varname = params.varname ?? 'tcpClient';
				const newline = params.newline ?? '0';
				const data = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;
				const fn = newline === '1' ? 'println' : 'print';
				return {
					parts: [
						[`${pad}${varname}.${fn}(${data});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'tcp_available',
			name: 'TCP Available',
			color: '#ec4899',
			icon: '📊',
			category: 'tcp',
			description: 'ตรวจสอบจำนวน byte ที่รอรับอยู่ใน TCP buffer (client.available)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'count', type: 'output', label: 'Count', dataType: 'int', description: 'จำนวน byte ที่พร้อมอ่าน' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'tcpClient';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = ${varname}.available();`],
						{ portId: 'count', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'tcp_read_string',
			name: 'TCP Read String',
			color: '#ec4899',
			icon: '📥',
			category: 'tcp',
			description: 'อ่านข้อมูลทั้งหมดจาก TCP buffer เป็น String (client.readString)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'data', type: 'output', label: 'Data', dataType: 'String', description: 'ข้อมูลที่รับได้จาก TCP' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'tcpClient';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = ${varname}.readString();`],
						{ portId: 'data', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'tcp_read_until',
			name: 'TCP Read Until',
			color: '#ec4899',
			icon: '📋',
			category: 'tcp',
			description: 'อ่านข้อมูลจาก TCP จนถึง terminator ที่กำหนด (client.readStringUntil)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'data', type: 'output', label: 'Data', dataType: 'String', description: 'ข้อมูลที่อ่านได้' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
				{ id: 'terminator', type: 'text', label: 'Terminator', default: '\\n', description: 'อักขระหยุดอ่าน เช่น \\n' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'tcpClient';
				const terminator = (params.terminator ?? '\\n').replaceAll('"', '\\"');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = ${varname}.readStringUntil('${terminator}');`],
						{ portId: 'data', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'tcp_stop',
			name: 'TCP Stop',
			color: '#ec4899',
			icon: '🔴',
			category: 'tcp',
			description: 'ปิด TCP connection (client.stop)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'varname', category: 'tcp', label: 'Client', default: 'tcpClient' },
			],
			toCode({ pad, params }) {
				const varname = params.varname ?? 'tcpClient';
				return {
					parts: [
						[`${pad}${varname}.stop();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
