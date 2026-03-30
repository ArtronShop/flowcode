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
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int' }],
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
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'float' }],
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
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'String' }],
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
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'bool' }],
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
			id: 'lit_select',
			name: 'Select',
			color: '#06b6d4',
			icon: '▾',
			category: 'data',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'any' }],
			params: [
				{
					id: 'value',
					type: 'option',
					options: [
						{ label: 'HIGH', value: 'HIGH' },
						{ label: 'LOW', value: 'LOW' },
						{ label: 'INPUT', value: 'INPUT' },
						{ label: 'OUTPUT', value: 'OUTPUT' },
						{ label: 'INPUT_PULLUP', value: 'INPUT_PULLUP' }
					]
				}
			],
			toExpr(params) { return params.value ?? 'HIGH'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'variable',
			name: 'Variable',
			color: '#ec4899',
			icon: 'x',
			category: 'data',
			inputs: [{ id: 'set', type: 'input', label: 'Set', dataType: 'int' }],
			outputs: [{ id: 'get', type: 'output', label: 'Get', dataType: 'int' }],
			toCode({ block, pad, safeId, resolveInput }) {
				let init = '0';
				try { init = resolveInput('set') ?? '0'; } catch { /* ไม่มีค่าเริ่มต้น ใช้ 0 */ }
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = ${init};`],
						{ portId: 'get', depthDelta: 0 }
					]
				};
			}
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
			toCode({ block, pad, safeId, resolveInput }) {
				let a = '0', b = '0';
				try { a = resolveInput('a') ?? '0'; } catch { /* ใช้ 0 */ }
				try { b = resolveInput('b') ?? '0'; } catch { /* ใช้ 0 */ }
				return {
					parts: [
						[`${pad}float ${safeId(block.id)} = ${a} + ${b};`],
						{ portId: 'result', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'string',
			name: 'String',
			color: '#f97316',
			icon: '"',
			category: 'data',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'String' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'String' }],
			toCode({ block, pad, safeId, resolveInput }) {
				let src = '""';
				try { src = resolveInput('in') ?? '""'; } catch { /* ใช้ string ว่าง */ }
				return {
					parts: [
						[`${pad}String ${safeId(block.id)} = ${src};`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
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
				try {
					const val = resolveInput('push') ?? '';
					if (val) lines.push(`${pad}${id}[${id}_size++] = ${val};`);
				} catch { /* ไม่มีค่า push */ }
				return {
					parts: [
						lines,
						{ portId: 'items', depthDelta: 0 }
					]
				};
			}
		}
	]
};
