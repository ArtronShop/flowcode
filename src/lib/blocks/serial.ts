import type { BlockCategory } from './types.js';

export const serialCategory: BlockCategory = {
	name: 'Serial',
	blocks: [
		{
			id: 'serial_begin',
			name: 'Serial Begin',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			description: 'เริ่มต้นการสื่อสาร Serial Monitor พร้อมกำหนดความเร็ว Baudrate (Serial.begin)',
			inputs: [{ id: 'before', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{ id: 'baud', label: 'Baudrate', type: 'number', default: '115200', description: 'ความเร็วสื่อสาร' }
			],
			toCode({ pad, params }) {
				const val = params.baud ?? '';
				return {
					parts: [
						[`${pad}Serial.begin(${val});`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'serial_print_text',
			name: 'Serial Print Text',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			description: 'พิมพ์ข้อความคงที่ออก Serial Monitor (Serial.print)',
			inputs: [{ id: 'before', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{ id: 'text', label: 'Text', type: 'text', default: 'Hello, World !', 'description': 'ข้อความที่ต้องการส่งออก Serial' }
			],
			toCode({ pad, params }) {
				let val = params.text ?? '';
				val = val.replaceAll('"', '\\"');
				return {
					parts: [
						[`${pad}Serial.print("${val}");`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'serial_print_value',
			name: 'Serial Print Value',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			description: 'พิมพ์ค่าตัวแปรจากบล็อกอื่นออก Serial Monitor (Serial.print)',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any', description: 'ค่าที่ต้องการพิมพ์ออก Serial (รับได้ทุก type)' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			toCode({ pad, resolveInput }) {
				const val = resolveInput('value');
				return {
					parts: [
						[`${pad}Serial.print(${val});`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
	]
};
