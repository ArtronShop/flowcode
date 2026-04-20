import { i2cCategory as i2cCategoryBuildIn } from '$lib/blocks/i2c';

const i2cCategory = i2cCategoryBuildIn;
i2cCategory.blocks = [
    {
        id: 'power_i2c_control',
        name: 'I2C Power Control',
        color: i2cCategory.blocks[0].color,
        icon: '🔌',
        category: 'i2c',
        description: 'เปิด/ปิดวงจร I2C',
        inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' },],
        outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
        params: [
            {
                id: 'state', type: 'option', label: 'State',
                options: [
                    { label: 'Enable (ON)', value: 'enable' },
                    { label: 'Disable (OFF)', value: 'disable' },
                ],
            },
        ],
        toCode({ pad, params, registerPreprocessor }) {
            const state = params.state ?? 'disable';

            registerPreprocessor('#include <TinkerC6.h>');

            return {
                parts: [
                    [`${pad}TinkerC6.I2C.${state}();`],
                    { portId: 'out', depthDelta: 0 },
                ]
            };
        }
    },

    ...i2cCategory.blocks
];

export { i2cCategory };

