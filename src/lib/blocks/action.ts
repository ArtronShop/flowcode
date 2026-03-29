import type { BlockCategory } from './types.js';

export const actionCategory: BlockCategory = {
	name: 'Action',
	blocks: [
		{
			id: 'print',
			name: 'Print',
			color: '#6366f1',
			icon: '📝',
			category: 'action',
			inputs: [{ id: 'value', type: 'input', label: 'Value' }],
			outputs: [{ id: 'next', type: 'output', label: 'Next' }],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}printf("%d\\n", value);`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'delay',
			name: 'Delay',
			color: '#84cc16',
			icon: '⏱',
			category: 'action',
			inputs: [{ id: 'in', type: 'input', label: 'In' }],
			outputs: [{ id: 'out', type: 'output', label: 'Out' }],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}sleep(1); /* delay */`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'http',
			name: 'HTTP Request',
			color: '#0ea5e9',
			icon: '🌐',
			category: 'action',
			inputs: [{ id: 'trigger', type: 'input', label: 'Trigger' }],
			outputs: [
				{ id: 'success', type: 'output', label: 'Success' },
				{ id: 'error', type: 'output', label: 'Error' }
			],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}/* HTTP Request — ใช้ libcurl: curl_easy_perform(curl); */`],
						{ portId: 'success', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'function',
			name: 'Function',
			color: '#fb923c',
			icon: 'ƒ',
			category: 'action',
			inputs: [
				{ id: 'call', type: 'input', label: 'Call' },
				{ id: 'args', type: 'input', label: 'Args' }
			],
			outputs: [{ id: 'return', type: 'output', label: 'Return' }],
			toCode({ block, pad, safeId }) {
				return {
					parts: [
						[`${pad}${safeId(block.id)}_func();`],
						{ portId: 'return', depthDelta: 0 }
					]
				};
			}
		}
	]
};
