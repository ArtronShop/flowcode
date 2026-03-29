import type { BlockCategory } from './types.js';

export const dataCategory: BlockCategory = {
	name: 'Data',
	blocks: [
		{
			id: 'variable',
			name: 'Variable',
			color: '#ec4899',
			icon: 'x',
			category: 'data',
			inputs: [{ id: 'set', type: 'input', label: 'Set' }],
			outputs: [{ id: 'get', type: 'output', label: 'Get' }],
			toCode({ block, pad, safeId }) {
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = 0;`],
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
				{ id: 'a', type: 'input', label: 'A' },
				{ id: 'b', type: 'input', label: 'B' }
			],
			outputs: [{ id: 'result', type: 'output', label: 'Result' }],
			toCode({ block, pad, safeId }) {
				return {
					parts: [
						[`${pad}int ${safeId(block.id)} = a + b;`],
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
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out' }],
			toCode({ block, pad, safeId }) {
				return {
					parts: [
						[`${pad}char ${safeId(block.id)}[256] = "";`],
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
			inputs: [{ id: 'push', type: 'input', label: 'Push' }],
			outputs: [{ id: 'items', type: 'output', label: 'Items' }],
			toCode({ block, pad, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id}[100];`, `${pad}int ${id}_size = 0;`],
						{ portId: 'items', depthDelta: 0 }
					]
				};
			}
		}
	]
};
