import type { BlockCategory } from './types.js';

/** คืน array ของ specifier character ตามลำดับ (เช่น ['d', 's', 'f']) ไม่นับ %% */
function getPrintfSpecifiers(format: string): string[] {
	const matches = format.match(/%%|%[-+0 #]*(?:\*|\d+)?(?:\.(?:\*|\d+))?(?:hh?|ll?|[ljztL])?[diouxXeEfgGaAcspn]/g) ?? [];
	return matches.filter(m => m !== '%%').map(m => m[m.length - 1]);
}

/** แปลง specifier character เป็น Arduino dataType */
function specifierToDataType(spec: string): string {
	if ('diouxX'.includes(spec)) return 'int';
	if ('eEfgGaA'.includes(spec)) return 'float';
	if (spec === 's') return 'String';
	if (spec === 'c') return 'char';
	return 'any';
}

/** ห่อ arg ด้วย String(...).c_str() เฉพาะ specifier %s เพื่อรองรับ Arduino String */
function wrapPrintfArgs(args: string[], specs: string[]): string[] {
	return args.map((a, i) => specs[i] === 's' ? `String(${a}).c_str()` : a);
}

export const dataCategory: BlockCategory = {
	name: 'Data',
	blocks: [
		// ── Literal / Constant blocks ──────────────────────────────────────────
		{
			id: 'lit_int',
			name: 'Integer',
			color: '#3b82f6',
			icon: '#',
			category: 'data',
			description: 'ค่าคงที่ประเภท Integer (จำนวนเต็ม) ใช้ต่อเข้า input ที่รับค่า int, long, float หรือ double',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่า Integer ที่กำหนด' }],
			params: [
				{ id: 'value', type: 'number', default: '0', validation: (n) => Math.trunc(n) }
			],
			toExpr(params) { return params.value ?? '0'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'lit_float',
			name: 'Float',
			color: '#8b5cf6',
			icon: '#.',
			category: 'data',
			description: 'ค่าคงที่ประเภท Float (ทศนิยม 32-bit) จะมี suffix "f" ต่อท้ายอัตโนมัติ',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'float', description: 'ค่า Float ที่กำหนด (เช่น 3.14f)' }],
			params: [
				{ id: 'value', type: 'number', default: '0.0' }
			],
			toExpr(params) {
				const v = params.value ?? '0.0';
				return v.includes('.') ? `${v}f` : `${v}.0f`;
			},
			toCode() { return { parts: [] }; }
		},
		{
			id: 'lit_string',
			name: 'String',
			color: '#ef4444',
			icon: '"',
			category: 'data',
			description: 'ค่าคงที่ประเภท String (ข้อความ) จะถูก escape อัตโนมัติ',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'String', description: 'ข้อความที่กำหนด (String literal)' }],
			params: [
				{ id: 'value', type: 'text', default: '' }
			],
			toExpr(params) {
				const escaped = (params.value ?? '').replaceAll('"', '\\"');
				return `"${escaped}"`;
			},
			toCode() { return { parts: [] }; }
		},
		{
			id: 'lit_bool',
			name: 'Bool',
			color: '#f59e0b',
			icon: '✓',
			category: 'data',
			description: 'ค่าคงที่ประเภท Boolean (true หรือ false)',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'bool', description: 'ค่า Boolean ที่กำหนด (true หรือ false)' }],
			params: [
				{
					id: 'value',
					type: 'option',
					options: [
						{ label: 'true', value: 'true' },
						{ label: 'false', value: 'false' }
					]
				}
			],
			toExpr(params) { return params.value === 'false' ? 'false' : 'true'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'math',
			name: 'Math',
			color: '#14b8a6',
			icon: '±',
			category: 'data',
			inputs: [
				{ id: 'a', type: 'input', label: 'A', dataType: 'float' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'float' }
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'float' }],
			params: [{
				id: 'operator', label: 'Operator', type: 'option', options: [
					{ label: '+', value: '+' },
					{ label: '-', value: '-' },
					{ label: '×', value: '*' },
					{ label: '÷', value: '/' },
				]
			}],
			toCode({ block, pad, safeId, resolveInput, params }) {
				const a = resolveInput('a') ?? '0';
				const b = resolveInput('b') ?? '0';
				const operator = params?.operator || '+';
				return {
					parts: [
						[`${pad}float ${safeId(block.id)} = ${a} ${operator} ${b};`],
						{ portId: 'result', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'trigonometric',
			name: 'Trigonometric',
			color: '#14b8a6',
			icon: '📐',
			category: 'data',
			inputs: [
				{ id: 'angle', type: 'input', label: 'Angle', dataType: 'float' },
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'float' }],
			params: [{
				id: 'function', label: 'Function', type: 'option', options: [
					{ label: 'sin', value: 'sin' },
					{ label: 'cos', value: 'cos' },
					{ label: 'tan', value: 'tan' },
				]
			}],
			toCode({ block, pad, safeId, resolveInput, params }) {
				const angle = resolveInput('angle') ?? '0';
				const fn = params?.function || '';
				return {
					parts: [
						[`${pad}float ${safeId(block.id)} = ${fn}(${angle});`],
						{ portId: 'result', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'to_string',
			name: 'To String',
			color: '#f97316',
			icon: 'a',
			category: 'data',
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
			id: 'string_to_float',
			name: 'String to Float',
			color: '#f97316',
			icon: 'i',
			category: 'data',
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
			category: 'data',
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
			category: 'data',
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
		{
			id: 'void_to_int',
			name: 'Void to Int',
			color: '#f97316',
			icon: 'i',
			category: 'data',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'void' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'int' }],
			params: [{ id: 'value', type: 'number', label: 'Value', default: '0' }],
			toCode({ block, pad, safeId, params }) {
				const n = params?.n || 0;
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = ${n};`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		/*
		{
			id: 'array',
			name: 'Array',
			color: '#a78bfa',
			icon: '[]',
			category: 'data',
			inputs: [{ id: 'push', type: 'input', label: 'Push', dataType: 'any' }],
			outputs: [{ id: 'items', type: 'output', label: 'Items', dataType: 'any' }],
			toCode({ block, pad, safeId, resolveInput }) {
				const id = safeId(block.id);
				const lines = [`${pad}int ${id}[100];`, `${pad}int ${id}_size = 0;`];
				const val = resolveInput('push') ?? '';
				if (val) lines.push(`${pad}${id}[${id}_size++] = ${val};`);
				return {
					parts: [
						lines,
						{ portId: 'items', depthDelta: 0 }
					]
				};
			}
		}
		*/
	]
};
