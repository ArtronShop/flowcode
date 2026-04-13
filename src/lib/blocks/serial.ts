import type { BlockCategory } from './types.js';

function getPrintfSpecifiers(format: string): string[] {
	const matches = format.match(/%%|%[-+0 #]*(?:\*|\d+)?(?:\.(?:\*|\d+))?(?:hh?|ll?|[ljztL])?[diouxXeEfgGaAcspn]/g) ?? [];
	return matches.filter(m => m !== '%%').map(m => m[m.length - 1]);
}

function specifierToDataType(spec: string): string {
	if ('diouxX'.includes(spec)) return 'int';
	if ('eEfgGaA'.includes(spec)) return 'float';
	if (spec === 's') return 'String';
	if (spec === 'c') return 'char';
	return 'any';
}

function wrapPrintfArgs(args: string[], specs: string[]): string[] {
	return args.map((a, i) => specs[i] === 's' ? `String(${a}).c_str()` : a);
}

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
			id: 'serial_print',
			name: 'Serial Print',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			description: 'พิมพ์ข้อความคงที่ออก Serial Monitor (Serial.print)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'any', description: 'ค่าที่ต้องการพิมพ์ออก Serial (รับได้ทุก type)' }
			],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{ id: 'text', label: 'Text', type: 'text', default: 'Hello, World !', 'description': 'ข้อความที่ต้องการส่งออก Serial' },
				{ id: 'newline', label: 'New Line', type: 'option', options: [
					{ label: 'Yes', value: 'println', description: 'ขึ้นบรรทัดใหม่' },
					{ label: 'No', value: 'print', description: 'ไม่ขึ้นบรรทัดใหม่' },
				], default: 'println', description: 'ขึ้นบรรทัดใหม่' }
			],
			toCode({ pad, resolveInput, params }) {
				const val = resolveInput('value') ?? '"' + (params.text?.replaceAll('"', '\\"') ?? '') + '"';
				const method = params.newline ?? 'print';
				return {
					parts: [
						[`${pad}Serial.${method}(${val});`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'serial_printf',
			name: 'Serial Print Format',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			description: 'พิมพ์ค่าตัวแปรจากบล็อกอื่นออก Serial Monitor (Serial.print)',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'void' }],
			params: [
				{ id: 'format', type: 'text', label: 'Format', default: 'Value=%d\\n', description: 'รูปแบบ printf เช่น "Temp: %.1f" หรือ "Count: %d, Name: %s" (จำนวน input จะปรับตาม specifier อัตโนมัติ)' }
			],
			dynamicPorts({ format }) {
				const specs = getPrintfSpecifiers(format ?? '%d');
				return {
					inputs: [
						{ id: 'inp', type: 'input', label: '➜', dataType: 'void', description: 'สายลำดับการทำงาน' },
						...specs.map((spec, i) => ({
							id: `arg${i + 1}`, type: 'input' as const, label: `Arg ${i + 1}`, dataType: specifierToDataType(spec) as import('./types.js').DataType
						}))
					]
				};
			},
			toCode({ pad, resolveInput, params }) {
				const fmt = (params.format ?? '%d').replaceAll('"', '\\"');
				const specs = getPrintfSpecifiers(fmt);
				const args = specs.map((_, i) => resolveInput(`arg${i + 1}`) ?? '0');
				const wrappedArgs = wrapPrintfArgs(args, specs);
				const argsPart = wrappedArgs.length > 0 ? `, ${wrappedArgs.join(', ')}` : '';
				return {
					parts: [
						[`${pad}Serial.printf("${fmt}"${argsPart});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
