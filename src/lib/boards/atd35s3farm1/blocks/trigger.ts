import type { BlockCategory } from '$lib/blocks/types.js';

import { triggerCategory } from '$lib/blocks/trigger';

const ATD35S3_TRIGGER_IDS = ['time_alarm'];

triggerCategory.blocks = [
    ...triggerCategory.blocks.filter(b => !ATD35S3_TRIGGER_IDS.includes(b.id)),
    {
        id: 'time_alarm',
        trigger: true,
        name: 'Time Alarm',
        color: '#16a34a',
        icon: '⏲️',
        category: 'trigger',
        description: 'รันโค้ดซ้ำตามเวลาที่กำหนด',
        inputs: [],
        outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานที่รัน' }],
        params: [
            { id: 'hour', label: 'Hour (1-23)', type: 'number', default: '12' },
            { id: 'min', label: 'Min (0-59)', type: 'number', default: '15' },
        ],
        toCode({ pad, block, params, safeId, captureCode, registerGlobal, registerPollingCode }) {
            const id = safeId(block.id);
            const hour = params.hour ?? '12';
            const min = params.min ?? '15';
            const body = captureCode('out', 3);

            registerGlobal('extern struct tm timeinfo;');

            registerPollingCode([
                `{ // Time Alarm ${hour}:${min} (${id})`,
                `  static bool done = false;`,
                `  if ((timeinfo.tm_hour == ${hour}) && (timeinfo.tm_min == ${min})) {`,
                `    if (!done) {`,
                body,
                `      done = true;`,
                `    }`,
                `  } else {`,
                `    if (done) {`,
                `      done = false;`,
                `    }`,
                `  }`,
                `}`,
            ].join('\n'))

            return {
                parts: [

                ]
            };
        }
    },
];

export { triggerCategory };
