import type { BlockCategory } from '$lib/blocks/types';

const COLOR = '#b45309'; // amber-700

function parseCanData(data: string, dlc: number): string {
    const tokens = (data ?? '').trim().split(/[\s,]+/).filter(Boolean);
    const bytes: string[] = [];
    for (let i = 0; i < 8; i++) {
        if (i < dlc) {
            const tok = tokens[i] ?? '0';
            const n = parseInt(tok.replace(/^0x/i, ''), 16);
            bytes.push(`0x${(isNaN(n) ? 0 : n & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`);
        } else {
            bytes.push('0x00');
        }
    }
    return bytes.join(', ');
}

export const canCategory: BlockCategory = {
    name: 'CAN Bus (TWAI)',
    blocks: [

        // ─── On Receive ──────────────────────────────────────────────────
        {
            id: 'can_on_receive',
            name: 'CAN On Receive',
            trigger: true,
            color: COLOR,
            icon: '📨',
            category: 'CAN Bus',
            description: 'เรียกทุกครั้งที่รับ CAN message ใหม่\nภายใน handler ใช้ CAN Message ID / DLC / Byte เพื่ออ่านข้อมูล\nวางก่อนหรือหลัง CAN Begin ก็ได้',
            inputs: [],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            toCode({ captureCode, registerPreprocessor, registerGlobal, registerFunction }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');
                const body = captureCode('out', 1) ?? '';
                registerFunction(
                    'void _can_on_receive()',
                    body,
                    'void _can_on_receive();'
                );
                registerPreprocessor('#define CAN_ON_RECEIVE_CB _can_on_receive');
                return { parts: [] };
            }
        },

        // ─── Begin ───────────────────────────────────────────────────────
        {
            id: 'can_begin',
            name: 'CAN Begin',
            color: COLOR,
            icon: '🚌',
            category: 'CAN Bus',
            description: 'ติดตั้งและเริ่มต้น CAN bus (ESP32 TWAI driver)\nไม่ต้องติดตั้ง library เพิ่ม — ใช้ ESP-IDF driver ที่ฝังใน Arduino Core',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                {
                    id: 'bitrate', type: 'option', label: 'Bitrate', default: '500k',
                    description: 'ความเร็ว CAN bus — ต้องตรงกันทุก node บน bus',
                    options: [
                        { label: '25 Kbps', value: '25k' },
                        { label: '50 Kbps', value: '50k' },
                        { label: '100 Kbps', value: '100k' },
                        { label: '125 Kbps', value: '125k' },
                        { label: '250 Kbps', value: '250k' },
                        { label: '500 Kbps', value: '500k' },
                        { label: '800 Kbps', value: '800k' },
                        { label: '1 Mbps', value: '1m' },
                    ],
                },
                {
                    id: 'mode', type: 'option', label: 'Mode', default: 'normal',
                    description: 'Normal: ส่ง-รับปกติ | No ACK: ไม่ส่ง ACK (ทดสอบ standalone) | Listen Only: รับอย่างเดียว',
                    options: [
                        { label: 'Normal', value: 'normal' },
                        { label: 'No ACK', value: 'no_ack' },
                        { label: 'Listen Only', value: 'listen_only' },
                    ],
                },
            ],
            toCode({ pad, params, registerPreprocessor, registerGlobal, registerPollingCode }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');

                const tx = '26';
                const rx = '27';

                const bitrateMap: Record<string, string> = {
                    '25k': 'TWAI_TIMING_CONFIG_25KBITS()',
                    '50k': 'TWAI_TIMING_CONFIG_50KBITS()',
                    '100k': 'TWAI_TIMING_CONFIG_100KBITS()',
                    '125k': 'TWAI_TIMING_CONFIG_125KBITS()',
                    '250k': 'TWAI_TIMING_CONFIG_250KBITS()',
                    '500k': 'TWAI_TIMING_CONFIG_500KBITS()',
                    '800k': 'TWAI_TIMING_CONFIG_800KBITS()',
                    '1m': 'TWAI_TIMING_CONFIG_1MBITS()',
                };
                const modeMap: Record<string, string> = {
                    'normal': 'TWAI_MODE_NORMAL',
                    'no_ack': 'TWAI_MODE_NO_ACK',
                    'listen_only': 'TWAI_MODE_LISTEN_ONLY',
                };
                const timingConfig = bitrateMap[params.bitrate ?? '500k'] ?? 'TWAI_TIMING_CONFIG_500KBITS()';
                const modeConst = modeMap[params.mode ?? 'normal'] ?? 'TWAI_MODE_NORMAL';

                registerPollingCode([
                    '#ifdef CAN_ON_RECEIVE_CB',
                    '  memset(&_twai_rx_buf, 0, sizeof(_twai_rx_buf));',
                    '  if (twai_receive(&_twai_rx_buf, 0) == ESP_OK) {',
                    '    CAN_ON_RECEIVE_CB();',
                    '  }',
                    '#endif',
                ].join('\n'));

                return {
                    parts: [
                        [
                            `${pad}{ twai_general_config_t _twai_gcfg = TWAI_GENERAL_CONFIG_DEFAULT((gpio_num_t)${tx}, (gpio_num_t)${rx}, ${modeConst});`,
                            `${pad}  twai_timing_config_t _twai_tcfg = ${timingConfig};`,
                            `${pad}  twai_filter_config_t _twai_fcfg = TWAI_FILTER_CONFIG_ACCEPT_ALL();`,
                            `${pad}  twai_driver_install(&_twai_gcfg, &_twai_tcfg, &_twai_fcfg);`,
                            `${pad}  twai_start(); }`,
                        ],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Send ─────────────────────────────────────────────────────────
        {
            id: 'can_send',
            name: 'CAN Send',
            color: COLOR,
            icon: '📤',
            category: 'CAN Bus',
            description: 'ส่ง CAN message\nData: ค่า hex คั่นด้วยช่องว่างหรือ comma เช่น 01 FF A5 00',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'ส่งสำเร็จ' },
                { id: 'err', type: 'output', label: 'Error', dataType: 'void', description: 'TX queue เต็ม หรือ timeout' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                { id: 'identifier', type: 'text', label: 'Identifier (hex)', default: '0x123', description: 'CAN ID (11-bit standard: 0x000–0x7FF | 29-bit extended: สูงสุด 0x1FFFFFFF)' },
                {
                    id: 'frame_type', type: 'option', label: 'Frame Type', default: 'standard',
                    options: [
                        { label: 'Standard (11-bit)', value: 'standard' },
                        { label: 'Extended (29-bit)', value: 'extended' },
                    ],
                },
                {
                    id: 'dlc', type: 'number', label: 'DLC (0–8)', default: '8',
                    description: 'จำนวน byte ของข้อมูล (Data Length Code)',
                    validation: (n: number) => Math.min(8, Math.max(0, Math.round(n))),
                },
                {
                    id: 'data', type: 'text', label: 'Data (hex)', default: '00 00 00 00 00 00 00 00',
                    description: 'ข้อมูล hex คั่นด้วยช่องว่างหรือ comma เช่น 01 FF A5 00 00 00 00 00',
                },
                {
                    id: 'timeout', type: 'number', label: 'Timeout (ms)', default: '100',
                    description: 'เวลารอ TX queue ว่าง (0 = ไม่รอ)',
                    validation: (n: number) => Math.max(0, Math.round(n)),
                },
            ],
            toCode({ block, safeId, pad, params, registerPreprocessor }) {
                registerPreprocessor('#include <driver/twai.h>');

                const id_ = safeId(block.id);
                const ident = params.identifier ?? '0x123';
                const extended = params.frame_type === 'extended' ? '1' : '0';
                const dlc = Math.min(8, Math.max(0, Number(params.dlc ?? '8')));
                const timeout = params.timeout ?? '100';
                const dataBytes = parseCanData(params.data ?? '', dlc);

                return {
                    parts: [
                        [
                            `${pad}{ twai_message_t ${id_}_msg = {};`,
                            `${pad}  ${id_}_msg.identifier = ${ident};`,
                            `${pad}  ${id_}_msg.extd = ${extended};`,
                            `${pad}  ${id_}_msg.data_length_code = ${dlc};`,
                            `${pad}  uint8_t ${id_}_d[] = {${dataBytes}};`,
                            `${pad}  memcpy(${id_}_msg.data, ${id_}_d, 8);`,
                            `${pad}  if (twai_transmit(&${id_}_msg, pdMS_TO_TICKS(${timeout})) == ESP_OK) {`,
                        ],
                        { portId: 'ok', depthDelta: 1 },
                        [`${pad}  } else {`],
                        { portId: 'err', depthDelta: 1 },
                        [`${pad}  } }`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Message ID ───────────────────────────────────────────────────
        {
            id: 'can_msg_id',
            name: 'CAN Message ID',
            color: COLOR,
            icon: '🏷️',
            category: 'CAN Bus',
            description: 'ID ของ CAN message ที่รับล่าสุด\nใช้ภายใน CAN On Receive เท่านั้น',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: 'ID', dataType: 'int' }],
            toExpr: () => '((int) _twai_rx_buf.identifier)',
            toCode({ registerPreprocessor, registerGlobal }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');

                return {
                    parts: [
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Message DLC ──────────────────────────────────────────────────
        {
            id: 'can_msg_dlc',
            name: 'CAN Message DLC',
            color: COLOR,
            icon: '📏',
            category: 'CAN Bus',
            description: 'จำนวน byte ของ CAN message ที่รับล่าสุด (0–8)\nใช้ภายใน CAN On Receive เท่านั้น',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: 'DLC', dataType: 'int' }],
            toExpr: () => '((int) _twai_rx_buf.data_length_code)',
            toCode({ registerPreprocessor, registerGlobal }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');

                return {
                    parts: [
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Message Byte ─────────────────────────────────────────────────
        {
            id: 'can_msg_byte',
            name: 'CAN Message Byte',
            color: COLOR,
            icon: '🔢',
            category: 'CAN Bus',
            description: 'ค่า byte ที่ n ของ CAN message ที่รับล่าสุด\nใช้ภายใน CAN On Receive เท่านั้น',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: 'Byte', dataType: 'int' }],
            params: [
                {
                    id: 'index', type: 'number', label: 'Byte Index (0–7)', default: '0',
                    description: 'ตำแหน่ง byte (0 = byte แรก)',
                    validation: (n: number) => Math.min(7, Math.max(0, Math.round(n))),
                },
            ],
            toExpr(params) {
                const index = Math.min(7, Math.max(0, Number(params.index ?? '0')));
                return `(int)_twai_rx_buf.data[${index}]`;
            },
            toCode({ registerPreprocessor, registerGlobal }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');
                return {
                    parts: [
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Message Format ──────────────────────────────────────────────
        {
            id: 'can_msg_format',
            name: 'CAN Message Format',
            color: COLOR,
            icon: '🔀',
            category: 'CAN Bus',
            description: 'แปลง byte ใน CAN message เป็น typed value\nเลือก Type, Start Byte และ Byte Order (endian)\nใช้ภายใน CAN On Receive',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'value', type: 'output', label: 'Value', dataType: 'float' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                {
                    id: 'data_type', type: 'option', label: 'Type', default: 'float',
                    description: 'ชนิดข้อมูลที่ต้องการได้',
                    options: [
                        { label: 'Int8   (1 byte)', value: 'int8' },
                        { label: 'UInt8  (1 byte)', value: 'uint8' },
                        { label: 'Int16  (2 bytes)', value: 'int16' },
                        { label: 'UInt16 (2 bytes)', value: 'uint16' },
                        { label: 'Int32  (4 bytes)', value: 'int32' },
                        { label: 'UInt32 (4 bytes)', value: 'uint32' },
                        { label: 'Float  (4 bytes)', value: 'float' },
                        { label: 'Double (8 bytes)', value: 'double' },
                    ],
                },
                {
                    id: 'start_byte', type: 'number', label: 'Start Byte (0–7)', default: '0',
                    description: 'ตำแหน่ง byte แรกใน CAN data ที่ใช้แปลง',
                    validation: (n: number) => Math.min(7, Math.max(0, Math.round(n))),
                },
                {
                    id: 'endian', type: 'option', label: 'Byte Order', default: 'BE',
                    description: 'BE (Big Endian): MSB อยู่ byte แรก | LE (Little Endian): LSB อยู่ byte แรก',
                    options: [
                        { label: 'Big Endian (BE)', value: 'BE' },
                        { label: 'Little Endian (LE)', value: 'LE' },
                    ],
                    hidden: ({ params }) => params.data_type === 'int8' || params.data_type === 'uint8',
                },
            ],
            dynamicPorts(params) {
                const typeMap: Record<string, string> = {
                    int8: 'int', uint8: 'int', int16: 'int', uint16: 'int',
                    int32: 'int', uint32: 'int', float: 'float', double: 'float',
                };
                const dataType = typeMap[params.data_type ?? 'float'] ?? 'float';
                return {
                    outputs: [
                        { id: 'value', type: 'output', label: 'Value', dataType, description: 'ค่าที่แปลงแล้ว' },
                        { id: 'out', type: 'output', label: '➜', dataType: 'void' },
                    ]
                };
            },
            toCode({ pad, block, safeId, params, registerPreprocessor, registerGlobal }) {
                registerPreprocessor('#include <driver/twai.h>');
                registerGlobal('twai_message_t _twai_rx_buf;');

                const id = safeId(block.id);
                const dataType = params.data_type ?? 'float';
                const startByte = Math.min(7, Math.max(0, Number(params.start_byte ?? '0')));
                const littleEndian = (params.endian ?? 'BE') === 'LE';

                const cppTypeMap: Record<string, string> = {
                    int8: 'int8_t', uint8: 'uint8_t', int16: 'int16_t', uint16: 'uint16_t',
                    int32: 'int32_t', uint32: 'uint32_t', float: 'float', double: 'double',
                };
                const cppType = cppTypeMap[dataType] ?? 'float';

                const byteSizeMap: Record<string, number> = {
                    int8: 1, uint8: 1, int16: 2, uint16: 2,
                    int32: 4, uint32: 4, float: 4, double: 8,
                };
                const byteSize = byteSizeMap[dataType] ?? 4;

                const b = (i: number) => `_twai_rx_buf.data[${startByte + i}]`;

                // Integers: use shift arithmetic (no memcpy needed)
                if (dataType === 'int8' || dataType === 'uint8') {
                    return {
                        parts: [
                            [`${pad}${cppType} ${id} = (${cppType})${b(0)};`],
                            { portId: 'value', depthDelta: 0 },
                            { portId: 'out', depthDelta: 0 },
                        ]
                    };
                }

                if (dataType === 'int16' || dataType === 'uint16') {
                    const expr = littleEndian
                        ? `(${cppType})((uint16_t)${b(0)} | ((uint16_t)${b(1)} << 8))`
                        : `(${cppType})(((uint16_t)${b(0)} << 8) | (uint16_t)${b(1)})`;
                    return {
                        parts: [
                            [`${pad}${cppType} ${id} = ${expr};`],
                            { portId: 'value', depthDelta: 0 },
                            { portId: 'out', depthDelta: 0 },
                        ]
                    };
                }

                if (dataType === 'int32' || dataType === 'uint32') {
                    const expr = littleEndian
                        ? `(${cppType})((uint32_t)${b(0)} | ((uint32_t)${b(1)} << 8) | ((uint32_t)${b(2)} << 16) | ((uint32_t)${b(3)} << 24))`
                        : `(${cppType})(((uint32_t)${b(0)} << 24) | ((uint32_t)${b(1)} << 16) | ((uint32_t)${b(2)} << 8) | (uint32_t)${b(3)})`;
                    return {
                        parts: [
                            [`${pad}${cppType} ${id} = ${expr};`],
                            { portId: 'value', depthDelta: 0 },
                            { portId: 'out', depthDelta: 0 },
                        ]
                    };
                }

                // float / double — use memcpy (ESP32 is LE; reverse bytes for BE source)
                const rawBytes = Array.from({ length: byteSize }, (_, i) =>
                    b(littleEndian ? i : byteSize - 1 - i)
                ).join(', ');

                return {
                    parts: [
                        [
                            `${pad}${cppType} ${id};`,
                            `${pad}{`,
                            `${pad}  uint8_t _raw[${byteSize}] = { ${rawBytes} };`,
                            `${pad}  memcpy(&${id}, _raw, ${byteSize});`,
                            `${pad}}`,
                        ],
                        { portId: 'value', depthDelta: 0 },
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },
    ]
};
