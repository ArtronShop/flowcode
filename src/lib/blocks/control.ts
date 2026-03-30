import type { BlockCategory } from './types.js';

export const controlCategory: BlockCategory = {
	name: 'Control',
	blocks: [
		{
			id: 'delay',
			name: 'Delay',
			color: '#84cc16',
			icon: '⏱',
			category: 'action',
			inputs: [
				{ id: 'in', type: 'input', label: 'In', dataType: 'any' },
			],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'void' }],
			params: [{ id: 'time', type: 'number', label: 'Time (mS)', default: '1000' }],
			toCode({ pad, params }) {
				const time = params.time ?? '1000';
				return {
					parts: [
						[`${pad}delay(${time});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'condition',
			name: 'Condition',
			color: '#f59e0b',
			icon: '?',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'any' }],
			outputs: [
				{ id: 'true', type: 'output', label: 'True', dataType: 'void' },
				{ id: 'false', type: 'output', label: 'False', dataType: 'void' }
			],
			params: [
				{ id: 'condition', type: 'text', default: '== 1' }
			],
			toCode({ pad, resolveInput, params }) {
				const condition = params.condition ?? '== true';
				const inp = resolveInput('in') ?? 'true';
				return {
					parts: [
						[`${pad}if (${[inp, condition].join(' ')}) {`],
						{ portId: 'true', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'false', depthDelta: 1 },
						[`${pad}}`]
					]
				};
			}
		},
		{
			id: 'while_loop',
			name: 'Infinity Loop',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body', dataType: 'void' },
				{ id: 'done', type: 'output', label: 'Done', dataType: 'void' }
			],
			toCode({ pad, resolveInput }) {
				return {
					parts: [
						[`${pad}while (1) {`],
						{ portId: 'body', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'done', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'for_loop',
			name: 'For Loop',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body', dataType: 'void' },
				{ id: 'done', type: 'output', label: 'Done', dataType: 'void' }
			],
			params: [
				{ id: 'count', type: 'number', label: 'Loop count', default: '10' }
			],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}for (int i=0;i<${count};i++) {`],
						{ portId: 'body', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'done', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'loop_break',
			name: 'Loop Break',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}break;`],
					]
				};
			}
		},
		{
			id: 'loop_continue',
			name: 'Loop Continue',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}continue;`],
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
			inputs: [{ id: 'in', type: 'input', label: 'Value', dataType: 'int' }],
			outputs: [
				{ id: 'case1', type: 'output', label: 'Case 1', dataType: 'void' },
				{ id: 'case2', type: 'output', label: 'Case 2', dataType: 'void' },
				{ id: 'default', type: 'output', label: 'Default', dataType: 'void' }
			],
			toCode({ pad, resolveInput }) {
				let val = resolveInput('in') ?? '-1'
				return {
					parts: [
						[`${pad}switch (${val}) {`],
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
		},
	]
};
