import type { BlockCategory } from './types.js';

export const functionCategory: BlockCategory = {
	name: 'Function',
	blocks: [
		{
			id: 'call_function',
			name: 'Call Function',
			color: '#fb923c',
			icon: '📞',
			category: 'action',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [{ id: 'fn_name', type: 'text', label: 'Function Name', default: 'my_fn1'}],
			toCode({ pad, params }) {
				const fn_name = params.fn_name ?? '';
				return {
					parts: [
						[`${pad}${fn_name}();`],
						{ portId: 'return', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'make_function',
			name: 'Make Function',
			trigger: true,
			color: '#fb923c',
			icon: 'ƒ',
			category: 'action',
			inputs: [ ],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'any' }],
			params: [{ id: 'fn_name', type: 'text', label: 'Function Name', default: 'my_fn1'}],
			toCode({ block, pad, params, captureCode, registerFunction }) {
				const fn_name = params.fn_name ?? '';
				const body = captureCode('out', 1);
				registerFunction(
					`void ${fn_name}()`,
					body,
					`void ${fn_name}();`
				);
				return {
					parts: [

					]
				};
			}
		},
	]
};
