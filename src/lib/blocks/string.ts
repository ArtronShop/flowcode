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

export const stringCategory: BlockCategory = {
	name: 'String',
	blocks: [
		{
			id: 'to_string',
			name: 'To String',
			color: '#f97316',
			icon: 'a',
			category: 'string',
			description: 'แปลงข้อมูลตัวเลข / Bool เป็นข้อความ (String)',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'String' }],
			toCode({ block, pad, safeId, resolveInput }) {
				const src = resolveInput('in') ?? '""';
				return {
					parts: [
						[`${pad}String ${safeId(block.id)} = String(${src});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'string_to_int',
			name: 'String to Int',
			color: '#f97316',
			icon: 'i',
			category: 'string',
			description: 'แปลงข้อมูลข้อความ (String) เป็นตัวเลข',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'String' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'int' }],
			toCode({ block, pad, safeId, resolveInput }) {
				const src = resolveInput('in') ?? '""';
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = String(${src}).toInt();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'string_to_float',
			name: 'String to Float',
			color: '#f97316',
			icon: 'f',
			category: 'string',
			description: 'แปลงข้อมูลข้อความ (String) เป็นตัวเลข',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'String' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'float' }],
			toCode({ block, pad, safeId, resolveInput }) {
				const src = resolveInput('in') ?? '""';
				return {
					parts: [
						[`${pad}float ${safeId(block.id)} = String(${src}).toFloat();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'string_combine',
			name: 'String Combine',
			color: '#f97316',
			icon: '"+',
			category: 'string',
			description: 'รวมข้อความ/ตัวเลขเป็นข้อความเดียว',
			inputs: [
				{ id: 'in1', type: 'input', label: 'In 1', dataType: 'any' },
				{ id: 'in2', type: 'input', label: 'In 2', dataType: 'any' }
			],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'String' }],
			params: [{ id: 'count', type: 'number', label: 'จำนวน', default: '2', validation: (n: number) => Math.max(2, Math.min(10, n)), description: 'จำนวนข้อความที่ต้องการรวม (2–10)' }],
			dynamicPorts({ count }) {
				const n = Math.max(2, Math.min(10, parseInt(count) || 2));
				return {
					inputs: Array.from({ length: n }, (_, i) => ({
						id: `in${i + 1}`, type: 'input' as const, label: `In ${i + 1}`, dataType: 'any' as const
					}))
				};
			},
			toCode({ block, pad, safeId, resolveInput, params }) {
				const n = Math.max(2, Math.min(10, parseInt(params.count) || 2));
				const src = Array.from({ length: n }, (_, i) => resolveInput(`in${i + 1}`) ?? '""');
				return {
					parts: [
						[`${pad}String ${safeId(block.id)} = ${src.map(a => `String(${a})`).join(' + ')};`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'string_format',
			name: 'String Format',
			color: '#f97316',
			icon: '"%',
			category: 'string',
			description: 'จัดรูปแบบข้อความตาม format ของ printf ภาษา C เช่น "Temp: %.1f°C, Val: %d" จะแปลงผ่าน C string (char[]) ก่อน แล้วค่อยแปลงเป็น String',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'String' }],
			params: [
				{ id: 'format', type: 'text', label: 'Format', default: 'Value=%d', description: 'รูปแบบ printf เช่น "Temp: %.1f" หรือ "Count: %d, Name: %s" (จำนวน input จะปรับตาม specifier อัตโนมัติ)' }
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
			toCode({ block, pad, safeId, resolveInput, params }) {
				const fmt = (params.format ?? '%d').replaceAll('"', '\\"');
				const specs = getPrintfSpecifiers(fmt);
				const args = specs.map((_, i) => resolveInput(`arg${i + 1}`) ?? '0');
				const wrappedArgs = wrapPrintfArgs(args, specs);
				const id = safeId(block.id);
				const argsPart = wrappedArgs.length > 0 ? `, ${wrappedArgs.join(', ')}` : '';
				return {
					parts: [
						[
							`${pad}char ${id}_buf[256];`,
							`${pad}snprintf(${id}_buf, sizeof(${id}_buf), "${fmt}"${argsPart});`,
							`${pad}String ${id} = String(${id}_buf);`
						],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
