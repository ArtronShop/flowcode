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
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any' }],
			outputs: [{ id: 'next', type: 'output', label: 'Next', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const val = resolveInput('value');
				return {
					parts: [
						[`${pad}Serial.println(${val});`],
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
			inputs: [
				{ id: 'in', type: 'input', label: 'In', dataType: 'any' },
				{ id: 'ms', type: 'input', label: 'ms', dataType: 'long' }
			],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const ms = resolveInput('ms') ?? '1000';
				return {
					parts: [
						[`${pad}delay(${ms});`],
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
			inputs: [{ id: 'trigger', type: 'input', label: 'Trigger', dataType: 'void' }],
			outputs: [
				{ id: 'success', type: 'output', label: 'Success', dataType: 'void' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void' }
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
				{ id: 'call', type: 'input', label: 'Call', dataType: 'void' },
				{ id: 'args', type: 'input', label: 'Args', dataType: 'any' }
			],
			outputs: [{ id: 'return', type: 'output', label: 'Return', dataType: 'any' }],
			toCode({ block, pad, safeId, resolveInput }) {
				let args = resolveInput('args') ?? '';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}${id}_func(${args});`],
						{ portId: 'return', depthDelta: 0 }
					]
				};
			}
		}
	]
};
