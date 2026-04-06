import type { BlockCategory } from './types.js';

export const eepromCategory: BlockCategory = {
	name: 'EEPROM',
	blocks: [
		{
			id: 'eeprom_begin',
			name: 'EEPROM Begin',
			color: '#10b981',
			icon: '💾',
			category: 'eeprom',
			description: 'เริ่มต้น EEPROM จัดสรรขนาดพื้นที่ที่ต้องการ (EEPROM.begin)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'size', type: 'number', label: 'Size (bytes)', default: '512', description: 'ขนาด EEPROM ที่ต้องการ (สูงสุด 4096 บน ESP32)' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				const size = params.size ?? '512';
				return {
					parts: [
						[`${pad}EEPROM.begin(${size});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'eeprom_read',
			name: 'EEPROM Read',
			color: '#10b981',
			icon: '📖',
			category: 'eeprom',
			description: 'อ่านค่า 1 byte จาก EEPROM ตำแหน่งที่กำหนด (EEPROM.read)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',      dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'addr', type: 'input', label: 'Address', dataType: 'int', description: 'ตำแหน่ง address ที่ต้องการอ่าน' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'byte', description: 'ค่า byte ที่อ่านได้จาก EEPROM' }],
			params: [
				{ id: 'addr', type: 'number', label: 'Address', default: '0', description: 'ตำแหน่ง address (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
			],
			toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				const id   = safeId(block.id);
				const addr = resolveInput('addr') ?? params.addr ?? '0';
				return {
					parts: [
						[`${pad}byte ${id} = EEPROM.read(${addr});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'eeprom_write',
			name: 'EEPROM Write',
			color: '#10b981',
			icon: '✏️',
			category: 'eeprom',
			description: 'เขียนค่า 1 byte ลง EEPROM ตำแหน่งที่กำหนด (EEPROM.write) — ต้องเรียก Commit ด้วย',
			inputs: [
				{ id: 'in',    type: 'input', label: '➜',      dataType: 'any',  description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'addr',  type: 'input', label: 'Address', dataType: 'int',  description: 'ตำแหน่ง address ที่ต้องการเขียน' },
				{ id: 'value', type: 'input', label: 'Value',   dataType: 'byte', description: 'ค่า byte ที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'addr',  type: 'number', label: 'Address',     default: '0',   description: 'ตำแหน่ง address' },
				{ id: 'value', type: 'number', label: 'Value (byte)', default: '0',   description: 'ค่าที่จะเขียน' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				const addr  = resolveInput('addr')  ?? params.addr  ?? '0';
				const value = resolveInput('value') ?? params.value ?? '0';
				return {
					parts: [
						[`${pad}EEPROM.write(${addr}, ${value});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'eeprom_put_int',
			name: 'EEPROM Put Int',
			color: '#10b981',
			icon: '📝',
			category: 'eeprom',
			description: 'เขียนค่า int (2 bytes) ลง EEPROM (EEPROM.put) — ต้องเรียก Commit ด้วย',
			inputs: [
				{ id: 'in',    type: 'input', label: '➜',      dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'addr',  type: 'input', label: 'Address', dataType: 'int', description: 'ตำแหน่ง address' },
				{ id: 'value', type: 'input', label: 'Value',   dataType: 'int', description: 'ค่า int ที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'addr',  type: 'number', label: 'Address', default: '0', description: 'ตำแหน่ง address' },
				{ id: 'value', type: 'number', label: 'Value',   default: '0', description: 'ค่าที่จะเขียน' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				const addr  = resolveInput('addr')  ?? params.addr  ?? '0';
				const value = resolveInput('value') ?? params.value ?? '0';
				return {
					parts: [
						[`${pad}EEPROM.put(${addr}, (int)(${value}));`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'eeprom_get_int',
			name: 'EEPROM Get Int',
			color: '#10b981',
			icon: '📂',
			category: 'eeprom',
			description: 'อ่านค่า int (2 bytes) จาก EEPROM (EEPROM.get)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',      dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'addr', type: 'input', label: 'Address', dataType: 'int', description: 'ตำแหน่ง address' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่า int ที่อ่านได้จาก EEPROM' }],
			params: [
				{ id: 'addr', type: 'number', label: 'Address', default: '0', description: 'ตำแหน่ง address' },
			],
			toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				const id   = safeId(block.id);
				const addr = resolveInput('addr') ?? params.addr ?? '0';
				return {
					parts: [
						[`${pad}int ${id};`, `${pad}EEPROM.get(${addr}, ${id});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'eeprom_commit',
			name: 'EEPROM Commit',
			color: '#10b981',
			icon: '💿',
			category: 'eeprom',
			description: 'บันทึกการเปลี่ยนแปลงลง flash จริง (EEPROM.commit) — จำเป็นหลัง write/put',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <EEPROM.h>');
				return {
					parts: [
						[`${pad}EEPROM.commit();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
