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
				{ id: 'a', type: 'input', label: 'A', dataType: 'any' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'any' }
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'int' }],
			params: [
				{
					id: 'operator', label: 'Operator', type: 'option', options: [
						{ label: '+', value: '+' },
						{ label: '-', value: '-' },
						{ label: '×', value: '*' },
						{ label: '÷', value: '/' },
						{ label: '%', value: '%' },
					]
				},
				{
					id: 'output_type', label: 'Output Type', type: 'option', options: [
						{ label: 'int', value: 'int' },
						{ label: 'long', value: 'long' },
						{ label: 'float', value: 'float' },
					],
					default: 'int',
				},
			],
			dynamicPorts({ output_type }) {
				const dt = (output_type ?? 'int') as import('./types.js').DataType;
				return {
					outputs: [
						{ id: 'result', type: 'output' as const, label: 'Result', dataType: dt },
					],
				};
			},
			toCode({ block, pad, safeId, resolveInput, params }) {
				const a = resolveInput('a') ?? '0';
				const b = resolveInput('b') ?? '0';
				const operator = params.operator ?? '+';
				const type = params.output_type ?? 'int';
				// Cast both operands so integer division becomes float when needed
				return {
					parts: [
						[`${pad}${type} ${safeId(block.id)} = (${type})(${a}) ${operator} (${type})(${b});`],
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
			id: 'map_range',
			name: 'Map Range',
			color: '#14b8a6',
			icon: '📏',
			category: 'data',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any' }],
			outputs: [],
			params: [
				{
					id: 'data_type', label: 'Data Type', type: 'option', options: [
						{ label: 'int', value: 'int' },
						{ label: 'long', value: 'long' },
						{ label: 'float', value: 'float' },
					], default: 'int'
				},
				{ id: 'from_lo', label: 'from Low', type: 'number', default: '0' },
				{ id: 'from_hi', label: 'from High', type: 'number', default: '255' },
				{ id: 'to_lo', label: 'to Low', type: 'number', default: '0' },
				{ id: 'to_hi', label: 'to High', type: 'number', default: '100' },
			],
			dynamicPorts: params => ({
				outputs: [
					{ id: 'result', type: 'output', label: 'Result', dataType: params.data_type }
				]
			}),
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const value = resolveInput('value') ?? '0';
				const data_type = params?.data_type ?? 'int';
				const from_lo = params?.from_lo || '0';
				const from_hi = params?.from_hi || '255';
				const to_lo = params?.to_lo || '0';
				const to_hi = params?.to_hi || '100';
				// map() returns long (integer only) — use linear formula for float
				const expr = data_type === 'float'
					? `(float)(${value} - (${from_lo})) * ((${to_hi}) - (${to_lo})) / ((${from_hi}) - (${from_lo})) + (${to_lo})`
					: `(${data_type})map(${value}, ${from_lo}, ${from_hi}, ${to_lo}, ${to_hi})`;
				return {
					parts: [
						[`${pad}${data_type} ${id} = ${expr};`],
						{ portId: 'result', depthDelta: 0 }
					]
				};
			}
		},
		// ── Constrain ────────────────────────────────────────────────────────
		{
			id: 'constrain',
			name: 'Constrain',
			color: '#14b8a6',
			icon: '⊞',
			category: 'data',
			description: 'จำกัดค่าให้อยู่ในช่วง [lo, hi] — constrain(value, lo, hi)',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any' }],
			outputs: [],
			params: [
				{
					id: 'data_type', label: 'Type', type: 'option', default: 'int',
					options: [{ label: 'int', value: 'int' }, { label: 'long', value: 'long' }, { label: 'float', value: 'float' }],
				},
				{ id: 'lo', label: 'Min', type: 'number', default: '0' },
				{ id: 'hi', label: 'Max', type: 'number', default: '100' },
			],
			dynamicPorts: params => ({ outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: params.data_type ?? 'int' }] }),
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const v  = resolveInput('value') ?? '0';
				const t  = params.data_type ?? 'int';
				return { parts: [[`${pad}${t} ${id} = (${t})constrain(${v}, ${params.lo ?? '0'}, ${params.hi ?? '100'});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Abs ──────────────────────────────────────────────────────────────
		{
			id: 'abs_value',
			name: 'Abs',
			color: '#14b8a6',
			icon: '|x|',
			category: 'data',
			description: 'ค่าสัมบูรณ์ — abs(value)',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any' }],
			outputs: [],
			params: [
				{
					id: 'data_type', label: 'Type', type: 'option', default: 'int',
					options: [{ label: 'int', value: 'int' }, { label: 'long', value: 'long' }, { label: 'float', value: 'float' }],
				},
			],
			dynamicPorts: params => ({ outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: params.data_type ?? 'int' }] }),
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const v  = resolveInput('value') ?? '0';
				const t  = params.data_type ?? 'int';
				const fn = t === 'float' ? 'fabsf' : 'abs';
				return { parts: [[`${pad}${t} ${id} = (${t})${fn}(${v});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Min / Max ─────────────────────────────────────────────────────────
		{
			id: 'min_max',
			name: 'Min / Max',
			color: '#14b8a6',
			icon: '⇅',
			category: 'data',
			description: 'ค่าน้อยสุดหรือมากสุดระหว่างสองค่า — min(a, b) / max(a, b)',
			inputs: [
				{ id: 'a', type: 'input', label: 'A', dataType: 'any' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'any' },
			],
			outputs: [],
			params: [
				{
					id: 'fn', label: 'Function', type: 'option', default: 'min',
					options: [{ label: 'min(A, B)', value: 'min' }, { label: 'max(A, B)', value: 'max' }],
				},
				{
					id: 'data_type', label: 'Type', type: 'option', default: 'int',
					options: [{ label: 'int', value: 'int' }, { label: 'long', value: 'long' }, { label: 'float', value: 'float' }],
				},
			],
			dynamicPorts: params => ({ outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: params.data_type ?? 'int' }] }),
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const a  = resolveInput('a') ?? '0';
				const b  = resolveInput('b') ?? '0';
				const t  = params.data_type ?? 'int';
				const fn = params.fn ?? 'min';
				return { parts: [[`${pad}${t} ${id} = (${t})${fn}(${a}, ${b});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Math Function ─────────────────────────────────────────────────────
		{
			id: 'math_func',
			name: 'Math Function',
			color: '#14b8a6',
			icon: '𝑓(x)',
			category: 'data',
			description: 'ฟังก์ชันคณิตศาสตร์ — sqrt, pow, round, floor, ceil, log',
			inputs: [],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'float' }],
			params: [
				{
					id: 'fn', label: 'Function', type: 'option', default: 'sqrt',
					options: [
						{ label: 'sqrt(x)',    value: 'sqrt'  },
						{ label: 'pow(x, exp)', value: 'pow'  },
						{ label: 'round(x)',   value: 'round' },
						{ label: 'floor(x)',   value: 'floor' },
						{ label: 'ceil(x)',    value: 'ceil'  },
						{ label: 'log(x)',     value: 'log'   },
						{ label: 'log10(x)',   value: 'log10' },
						{ label: 'exp(x)',     value: 'exp'   },
					],
				},
			],
			dynamicPorts({ fn }) {
				const hasPow = fn === 'pow';
				return {
					inputs: [
						{ id: 'x',   type: 'input', label: hasPow ? 'Base' : 'X', dataType: 'float' as const },
						...(hasPow ? [{ id: 'exp', type: 'input' as const, label: 'Exp', dataType: 'float' as const }] : []),
					],
				};
			},
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id  = safeId(block.id);
				const fn  = params.fn ?? 'sqrt';
				const x   = resolveInput('x') ?? '0';
				const exp = resolveInput('exp') ?? '2';
				const call = fn === 'pow' ? `pow(${x}, ${exp})` : `${fn}(${x})`;
				return { parts: [[`${pad}float ${id} = (float)${call};`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Comparison ────────────────────────────────────────────────────────
		{
			id: 'comparison',
			name: 'Comparison',
			color: '#6366f1',
			icon: '≠',
			category: 'data',
			description: 'เปรียบเทียบสองค่า คืนค่า bool — A > B, A == B, ...',
			inputs: [
				{ id: 'a', type: 'input', label: 'A', dataType: 'any' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'any', description: 'ถ้าไม่ต่อสาย ใช้ค่าจาก param' },
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'bool' }],
			params: [
				{
					id: 'op', label: 'Operator', type: 'option', default: '==',
					options: [
						{ label: '== (เท่ากับ)',       value: '==' },
						{ label: '!= (ไม่เท่ากับ)',     value: '!=' },
						{ label: '>  (มากกว่า)',        value: '>'  },
						{ label: '>= (มากกว่าหรือเท่า)', value: '>=' },
						{ label: '<  (น้อยกว่า)',        value: '<'  },
						{ label: '<= (น้อยกว่าหรือเท่า)', value: '<=' },
					],
				},
				{ id: 'b_val', label: 'B (literal)', type: 'number', default: '0', description: 'ใช้เมื่อไม่มีบล็อกต่อเข้า B' },
			],
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const a  = resolveInput('a') ?? '0';
				const b  = resolveInput('b') ?? (params.b_val ?? '0');
				const op = params.op ?? '==';
				return { parts: [[`${pad}bool ${id} = (${a}) ${op} (${b});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Logical ───────────────────────────────────────────────────────────
		{
			id: 'logical',
			name: 'Logical',
			color: '#6366f1',
			icon: '&&',
			category: 'data',
			description: 'AND / OR ของสอง bool — คืนค่า bool',
			inputs: [
				{ id: 'a', type: 'input', label: 'A', dataType: 'bool' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'bool' },
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'bool' }],
			params: [
				{
					id: 'op', label: 'Operator', type: 'option', default: '&&',
					options: [
						{ label: 'AND (&&)', value: '&&' },
						{ label: 'OR  (||)', value: '||' },
					],
				},
			],
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const a  = resolveInput('a') ?? 'false';
				const b  = resolveInput('b') ?? 'false';
				const op = params.op ?? '&&';
				return { parts: [[`${pad}bool ${id} = (${a}) ${op} (${b});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		{
			id: 'logical_not',
			name: 'NOT',
			color: '#6366f1',
			icon: '!',
			category: 'data',
			description: 'ผกผันค่า bool — !A',
			inputs: [{ id: 'a', type: 'input', label: 'A', dataType: 'bool' }],
			outputs: [{ id: 'result', type: 'output', label: 'Result', dataType: 'bool' }],
			params: [],
			toCode({ block, pad, safeId, resolveInput }) {
				const id = safeId(block.id);
				const a  = resolveInput('a') ?? 'false';
				return { parts: [[`${pad}bool ${id} = !(${a});`], { portId: 'result', depthDelta: 0 }] };
			}
		},
		// ── Bitwise ───────────────────────────────────────────────────────────
		{
			id: 'bitwise',
			name: 'Bitwise',
			color: '#64748b',
			icon: '&',
			category: 'data',
			description: 'การดำเนินการระดับ bit — &, |, ^, ~, <<, >>',
			inputs: [],
			outputs: [],
			params: [
				{
					id: 'op', label: 'Operator', type: 'option', default: '&',
					options: [
						{ label: 'AND  (&)',    value: '&'   },
						{ label: 'OR   (|)',    value: '|'   },
						{ label: 'XOR  (^)',    value: '^'   },
						{ label: 'NOT  (~)',    value: '~'   },
						{ label: 'SHL  (<<)',   value: '<<'  },
						{ label: 'SHR  (>>)',   value: '>>'  },
					],
				},
				{
					id: 'data_type', label: 'Type', type: 'option', default: 'int',
					options: [{ label: 'int', value: 'int' }, { label: 'long', value: 'long' }, { label: 'uint8_t', value: 'uint8_t' }, { label: 'uint16_t', value: 'uint16_t' }, { label: 'uint32_t', value: 'uint32_t' }],
				},
				{ id: 'shift', label: 'Shift Amount', type: 'number', default: '1', hidden: ({ params }) => params.op !== '<<' && params.op !== '>>' },
			],
			dynamicPorts({ op }) {
				const unary = op === '~';
				return {
					inputs: [
						{ id: 'a', type: 'input' as const, label: unary ? 'A' : 'A', dataType: 'int' as const },
						...(unary ? [] : [{ id: 'b', type: 'input' as const, label: 'B', dataType: 'int' as const }]),
					],
					outputs: [{ id: 'result', type: 'output' as const, label: 'Result', dataType: 'int' as const }],
				};
			},
			toCode({ block, pad, safeId, resolveInput, params }) {
				const id = safeId(block.id);
				const t  = params.data_type ?? 'int';
				const op = params.op ?? '&';
				const a  = resolveInput('a') ?? '0';
				const expr = op === '~'
					? `(${t})(~(${t})(${a}))`
					: (op === '<<' || op === '>>')
						? `(${t})((${t})(${a}) ${op} ${params.shift ?? '1'})`
						: `(${t})((${t})(${a}) ${op} (${t})(${resolveInput('b') ?? '0'}))`;
				return { parts: [[`${pad}${t} ${id} = ${expr};`], { portId: 'result', depthDelta: 0 }] };
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
