import type { BlockCategory } from './types.js';

export const udpCategory: BlockCategory = {
	name: 'UDP',
	blocks: [
		{
			id: 'udp_begin',
			name: 'UDP Begin',
			color: '#a855f7',
			icon: '🔊',
			category: 'udp',
			description: 'เริ่มรับ UDP packet บน port ที่กำหนด (udp.begin)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text',   label: 'Variable name', default: 'udp',  description: 'ชื่อตัวแปร WiFiUDP' },
				{ id: 'port',    type: 'number', label: 'Local Port',    default: '1234', description: 'port ที่ต้องการรับ UDP' },
			],
			toCode({ pad, params, registerPreprocessor, registerGlobal }) {
				registerPreprocessor('#include <WiFiUdp.h>');
				const varname = params.varname ?? 'udp';
				const port    = params.port    ?? '1234';
				registerGlobal(`WiFiUDP ${varname};`);
				return {
					parts: [
						[`${pad}${varname}.begin(${port});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_parse_packet',
			name: 'UDP Parse Packet',
			color: '#a855f7',
			icon: '📦',
			category: 'udp',
			description: 'ตรวจสอบ UDP packet ที่เข้ามา คืนขนาด packet (udp.parsePacket)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'size', type: 'output', label: 'Size', dataType: 'int', description: 'ขนาด packet ที่รับได้ (0 = ไม่มีข้อมูล)' }],
			params: [
				{ id: 'varname', type: 'text', label: 'Variable name', default: 'udp' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'udp';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = ${varname}.parsePacket();`],
						{ portId: 'size', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_read_string',
			name: 'UDP Read String',
			color: '#a855f7',
			icon: '📥',
			category: 'udp',
			description: 'อ่านข้อมูล UDP packet เป็น String',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'data', type: 'output', label: 'Data', dataType: 'String', description: 'ข้อมูลที่รับได้จาก UDP packet' }],
			params: [
				{ id: 'varname', type: 'text',   label: 'Variable name', default: 'udp' },
				{ id: 'size',    type: 'number', label: 'Buffer size',   default: '256', description: 'ขนาด buffer สำหรับรับข้อมูล' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'udp';
				const size    = params.size    ?? '256';
				const id = safeId(block.id);
				return {
					parts: [
						[
							`${pad}char _buf_${id}[${size}];`,
							`${pad}int _len_${id} = ${varname}.read(_buf_${id}, ${size} - 1);`,
							`${pad}if (_len_${id} > 0) _buf_${id}[_len_${id}] = 0;`,
							`${pad}String ${id} = String(_buf_${id});`,
						],
						{ portId: 'data', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_remote_ip',
			name: 'UDP Remote IP',
			color: '#a855f7',
			icon: '🌐',
			category: 'udp',
			description: 'รับ IP ของผู้ส่ง UDP packet ล่าสุดเป็น String',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'ip', type: 'output', label: 'IP', dataType: 'String', description: 'IP address ของผู้ส่ง' }],
			params: [
				{ id: 'varname', type: 'text', label: 'Variable name', default: 'udp' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'udp';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = ${varname}.remoteIP().toString();`],
						{ portId: 'ip', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_begin_packet',
			name: 'UDP Begin Packet',
			color: '#a855f7',
			icon: '▶️',
			category: 'udp',
			description: 'เริ่มต้นสร้าง UDP packet ไปยัง host:port (udp.beginPacket)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',   dataType: 'any',    description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'host', type: 'input', label: 'Host', dataType: 'String', description: 'IP address หรือ hostname ปลายทาง' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text',   label: 'Variable name', default: 'udp' },
				{ id: 'host',    type: 'text',   label: 'Host / IP',     default: '192.168.1.255', description: 'ปลายทาง (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{ id: 'port',    type: 'number', label: 'Port',          default: '1234' },
			],
			toCode({ pad, params, resolveInput }) {
				const varname = params.varname ?? 'udp';
				const host    = resolveInput('host') ?? `"${(params.host ?? '192.168.1.255').replaceAll('"', '\\"')}"`;
				const port    = params.port ?? '1234';
				return {
					parts: [
						[`${pad}${varname}.beginPacket(${host}, ${port});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_print',
			name: 'UDP Print',
			color: '#a855f7',
			icon: '📤',
			category: 'udp',
			description: 'เพิ่มข้อมูล String ลงใน UDP packet ที่กำลังสร้าง (udp.print)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',    dataType: 'any',    description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data',  dataType: 'String', description: 'ข้อมูลที่ต้องการส่ง' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text', label: 'Variable name', default: 'udp' },
				{ id: 'data',    type: 'text', label: 'Data',          default: '',   description: 'ข้อมูล (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
			],
			toCode({ pad, params, resolveInput }) {
				const varname = params.varname ?? 'udp';
				const data    = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;
				return {
					parts: [
						[`${pad}${varname}.print(${data});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'udp_end_packet',
			name: 'UDP End Packet',
			color: '#a855f7',
			icon: '🚀',
			category: 'udp',
			description: 'ส่ง UDP packet ออก (udp.endPacket)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text', label: 'Variable name', default: 'udp' },
			],
			toCode({ pad, params }) {
				const varname = params.varname ?? 'udp';
				return {
					parts: [
						[`${pad}${varname}.endPacket();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
