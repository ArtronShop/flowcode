import type { BlockCategory } from '$lib/blocks/types.js';

const COLOR = '#3b82f6';

export const analogCategory: BlockCategory = {
    name: 'Analog',
    blocks: [
        {
			id: 'get-current',
			name: 'Get Current (4-20mA)',
			color: COLOR,
			icon: '⚡',
			category: 'analog',
			description: 'อ่านค่า 4-20mA',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' },],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'float' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
                const id = safeId(block.id);

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}float ${id} = TinkerC6.Analog.getCurrent();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
    ]
};
