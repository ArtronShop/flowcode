import type { BlockCategory } from '$lib/blocks/types.js';

export const timeCategory: BlockCategory = {
    name: 'Time',
    blocks: [
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
        {
            id: 'time_get_time',
            name: 'Get Time',
            color: '#3b82f6',
            icon: '🔎',
            category: 'io',
            description: 'อ่านค่าเวลาปัจจุบัน',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
            outputs: [{ id: 'time', type: 'output', label: 'time', dataType: 'String', description: 'ค่าเวลา' }],
            params: [
                {
                    id: 'format', description: 'รูปแบบเวลา', type: 'option', label: 'Format', options: [
                        { label: 'd/m/y hh:ii:ss', value: '1' },
                        { label: 'hh:ii:ss', value: '2' },
                        { label: 'hh:ii', value: '3' },
                        { label: 'd/m/y', value: '4' },
                        { label: 'd-m-y', value: '5' },
                    ], default: '2'
                }
            ],
            toCode({ block, pad, safeId, params, registerGlobal }) {
                const id = safeId(block.id);
                const format = params.format ?? '2';

                registerGlobal('extern struct tm timeinfo;');

                let sprint = "";
                switch(format) {
                    case '1':
                        sprint = pad + '  snprintf(buff, sizeof(buff), "%d/%d/%d %02d:%02d:%02d", \n' +
                                 pad + '    timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900, timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);';
                        break;
                    case '2':
                        sprint = pad + '  snprintf(buff, sizeof(buff), "%02d:%02d:%02d", \n' +
                                 pad + '    timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);';
                        break;
                    case '3':
                        sprint = pad + '  snprintf(buff, sizeof(buff), "%02d:%02d", \n' +
                                 pad + '    timeinfo.tm_hour, timeinfo.tm_min);';
                        break;
                    case '4':
                        sprint = pad + '  snprintf(buff, sizeof(buff), "%d/%d/%d", \n' +
                                 pad + '    timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);';
                        break;
                    case '5':
                        sprint = pad + '  snprintf(buff, sizeof(buff), "%d-%d-%d", \n' +
                                 pad + '    timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);';
                        break;
                    
                }

                return {
                    parts: [
                        [`${pad}String ${id};`],
                        [`${pad}{`],
                        [`${pad}  char buff[64];`],
                        [sprint],
                        [`${pad}  ${id} = String(buff);`],
                        [`${pad}}`],
                        { portId: 'time', depthDelta: 0 }
                    ]
                };
            }
        },
    ]
};
