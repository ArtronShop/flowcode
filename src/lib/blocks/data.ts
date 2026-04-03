import type { BlockCategory } from './types.js';

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
				const escaped = (params.value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
		/*
		{
			id: 'variable',
			name: 'Variable',
			color: '#ec4899',
			icon: 'x',
			category: 'data',
			inputs: [{ id: 'set', type: 'input', label: 'Set', dataType: 'int' }],
			outputs: [{ id: 'get', type: 'output', label: 'Get', dataType: 'int' }],
			toCode({ block, pad, safeId, resolveInput }) {
				let init = resolveInput('set') ?? '0';
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = ${init};`],
						{ portId: 'get', depthDelta: 0 }
					]
				};
			}
		},*/
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
			params: [{ id: 'operator', label: 'Operator', type: 'option', options: [
				{ label: '+', value: '+' },
				{ label: '-', value: '-' },
				{ label: '×', value: '*' },
				{ label: '÷', value: '/' },
			]}],
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
			params: [{ id: 'function', label: 'Function', type: 'option', options: [
				{ label: 'sin', value: 'sin' },
				{ label: 'cos', value: 'cos' },
				{ label: 'tan', value: 'tan' },
			]}],
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
