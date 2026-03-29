import type { BlockCategory } from './types.js';

export const logicCategory: BlockCategory = {
	name: 'Logic',
	blocks: [
		{
			id: 'condition',
			name: 'Condition',
			color: '#f59e0b',
			icon: '?',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [
				{ id: 'true', type: 'output', label: 'True' },
				{ id: 'false', type: 'output', label: 'False' }
			],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}if (condition) {`],
						{ portId: 'true', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'false', depthDelta: 1 },
						[`${pad}}`]
					]
				};
			}
		},
		{
			id: 'loop',
			name: 'Loop',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body' },
				{ id: 'done', type: 'output', label: 'Done' }
			],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}while (condition) {`],
						{ portId: 'body', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'done', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'switch',
			name: 'Switch',
			color: '#e879f9',
			icon: '⇌',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [
				{ id: 'case1', type: 'output', label: 'Case 1' },
				{ id: 'case2', type: 'output', label: 'Case 2' },
				{ id: 'default', type: 'output', label: 'Default' }
			],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}switch (value) {`],
						[`${pad}    case 1:`],
						{ portId: 'case1', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}    case 2:`],
						{ portId: 'case2', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}    default:`],
						{ portId: 'default', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}}`]
					]
				};
			}
		}
	]
};
