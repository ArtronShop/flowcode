import type { BlockCategory } from './types.js';

export const serialCategory: BlockCategory = {
	name: 'Serial',
	blocks: [
		{
			id: 'serial_begin',
			name: 'Serial Begin',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			inputs: [{ id: 'before', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'baud', label: 'Baudrate', type: 'number', default: '115200' }
			],
			toCode({ pad, params }) {
				const val = params.baud ?? '';
				return {
					parts: [
						[`${pad}Serial.begin(${val});`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'serial_print_text',
			name: 'Serial Print Text',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			inputs: [{ id: 'before', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'text', label: 'Text', type: 'text', default: 'Hello, World !' }
			],
			toCode({ pad, params }) {
				let val = params.text ?? '';
				val = val.replaceAll('"', '\\"');
				return {
					parts: [
						[`${pad}Serial.print("${val}");`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'serial_print_value',
			name: 'Serial Print Value',
			color: '#6366f1',
			icon: '📝',
			category: 'serial',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'any' }],
			outputs: [{ id: 'next', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const val = resolveInput('value');
				return {
					parts: [
						[`${pad}Serial.print(${val});`],
						{ portId: 'next', depthDelta: 0 }
					]
				};
			}
		},
	]
};
