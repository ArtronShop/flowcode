import type { BlockCategory } from './types.js';

export const ioCategory: BlockCategory = {
	name: 'Input / Output',
	blocks: [
		{
			id: 'start',
			name: 'Start',
			color: '#22c55e',
			icon: '▶',
			category: 'io',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Out' }],
			toCode() {
				return { parts: [{ portId: 'out', depthDelta: 0 }] };
			}
		},
		{
			id: 'end',
			name: 'End',
			color: '#ef4444',
			icon: '■',
			category: 'io',
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [],
			toCode({ pad }) {
				return { parts: [[`${pad}return 0;`]] };
			}
		},
		{
			id: 'input',
			name: 'Input',
			color: '#3b82f6',
			icon: '⬇',
			category: 'io',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Value' }],
			toCode({ block, pad, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id};`, `${pad}scanf("%d", &${id});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'output',
			name: 'Output',
			color: '#8b5cf6',
			icon: '⬆',
			category: 'io',
			inputs: [{ id: 'value', type: 'input', label: 'Value' }],
			outputs: [],
			toCode({ pad }) {
				return { parts: [[`${pad}printf("%d\\n", value);`]] };
			}
		}
	]
};
