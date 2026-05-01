import type { BlockCategory, DataType } from '$lib/blocks/types.js';

const COLOR = '#78716c'; // stone-500

function registerSDBase(
    registerPreprocessor: (d: string) => void,
    registerFunction: (header: string, body: string, declaration?: string | undefined) => void,
) {
    registerPreprocessor('#include <ATD3.5-S3.h>');

    registerFunction(
        'bool sd_init()',
        [
            `  if (digitalRead(SD_CS_PIN) == HIGH) {`,
            `    if (Card.cardType() != CARD_NONE) {`,
            `      Card.end();`,
            `    }`,
            `    return false;`,
            `  }`,
            `  if (Card.cardType() == CARD_NONE) {`,
            `    return Card.begin();`,
            `  }`,
            `  return true;`
        ].join('\n'),
        'bool sd_init() ;',
    );

    registerFunction(
        'File sd_open(const String &path, const char *mode, const bool create)',
        [
            `  if (!sd_init()) return File();`,
            `  return Card.open(path, mode, create);`,
        ].join('\n'),
        'File sd_open(const String &path, const char *mode = FILE_READ, const bool create = false) ;'
    );
}

function getPrintfSpecifiers(format: string): string[] {
    const matches = format.match(/%%|%[-+0 #]*(?:\*|\d+)?(?:\.(?:\*|\d+))?(?:hh?|ll?|[ljztL])?[diouxXeEfgGaAcspn]/g) ?? [];
    return matches.filter(m => m !== '%%').map(m => m[m.length - 1]);
}

function specifierToDataType(spec: string): string {
    if ('diouxX'.includes(spec)) return 'int';
    if ('eEfgGaA'.includes(spec)) return 'float';
    if (spec === 's') return 'String';
    if (spec === 'c') return 'char';
    return 'any';
}

function wrapPrintfArgs(args: string[], specs: string[]): string[] {
    return args.map((a, i) => specs[i] === 's' ? `String(${a}).c_str()` : a);
}

export const cardCategory: BlockCategory = {
    name: 'MicroSD Card',
    blocks: [

        // ─── Begin ───────────────────────────────────────────────────────
        {
            id: 'card_begin',
            name: 'SD Card Begin',
            color: COLOR,
            icon: '💾',
            category: 'SD Card',
            description: 'เริ่มต้น SD Card',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            toCode({ pad, params, registerPreprocessor, registerGlobal, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                return {
                    parts: [
                        [`${pad}sd_init();`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },
        {
            id: 'card_is_dectected',
            name: 'SD Card is Detected',
            color: COLOR,
            icon: '🔗',
            category: 'SD Card',
            description: 'เช็คว่า SD Card เชื่อมต่ออยู่/ใส่อยู่หรือไม่',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'yes', type: 'output', label: 'Detected', dataType: 'void' },
                { id: 'no', type: 'output', label: 'Not Detect', dataType: 'void' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            toCode({ pad, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                return {
                    parts: [
                        [`${pad}if (sd_init()) {`],
                        { portId: 'yes', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'no', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Write ───────────────────────────────────────────────────────
        {
            id: 'card_write',
            name: 'SD Write',
            color: COLOR,
            icon: '📝',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'เขียนข้อมูลลงไฟล์ใน SD Card\npath ต้องขึ้นต้นด้วย / เช่น /data.csv',
            inputs: [
                { id: 'in', type: 'input', label: '➜', dataType: 'any' },
                { id: 'path', type: 'input', label: 'Path', dataType: 'String', description: 'ที่อยู่ไฟล์ (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
                { id: 'data', type: 'input', label: 'Data', dataType: 'any', description: 'ข้อมูลที่จะเขียน (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
            ],
            outputs: [
                { id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'เขียนสำเร็จ' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'เปิดไฟล์ไม่ได้' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                {
                    id: 'path', type: 'text', label: 'File Path', default: '/data.csv',
                    description: 'path ของไฟล์ ขึ้นต้นด้วย /',
                },
                {
                    id: 'mode', type: 'option', label: 'Mode', default: 'append',
                    options: [
                        { label: 'Append', value: 'append' },
                        { label: 'Overwrite', value: 'overwrite' },
                    ],
                },
                {
                    id: 'newline', type: 'option', label: 'New Line', default: 'yes',
                    options: [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                    ],
                },
                {
                    id: 'data', type: 'text', label: 'Data', default: '',
                    description: 'ใช้เมื่อไม่มีบล็อกต่อเข้ามา',
                },
            ],
            toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                const id = safeId(block.id);
                const path = resolveInput('path') ?? `"${(params.path ?? '/data.csv').replaceAll('"', '\\"')}"`;
                const fileMode = params.mode === 'overwrite' ? 'FILE_WRITE' : 'FILE_APPEND';
                const fn = params.newline === 'no' ? 'print' : 'println';
                const data = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;

                return {
                    parts: [
                        [`${pad}{`],
                        [`${pad}  File ${id}_f = sd_open(${path}, ${fileMode});`],
                        [`${pad}  if (${id}_f) {`],
                        [`${pad}    ${id}_f.${fn}(${data});`],
                        [`${pad}    ${id}_f.close();`],
                        { portId: 'ok', depthDelta: 2 },
                        [`${pad}  } else {`],
                        { portId: 'error', depthDelta: 2 },
                        [`${pad}  }`],
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Write Format ────────────────────────────────────────────────
        {
            id: 'card_write_format',
            name: 'SD Write Format',
            color: COLOR,
            icon: '🖊️',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'เขียนข้อมูลลงไฟล์แบบ printf format\nจำนวน input จะปรับอัตโนมัติตาม specifier ใน format string',
            inputs: [],
            outputs: [
                { id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'เขียนสำเร็จ' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'เปิดไฟล์ไม่ได้' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                {
                    id: 'path', type: 'text', label: 'File Path', default: '/data.csv',
                    description: 'path ของไฟล์ ขึ้นต้นด้วย /',
                },
                {
                    id: 'mode', type: 'option', label: 'Mode', default: 'append',
                    options: [
                        { label: 'Append', value: 'append' },
                        { label: 'Overwrite', value: 'overwrite' },
                    ],
                },
                {
                    id: 'format', type: 'text', label: 'Format', default: '%d,%.2f\\n',
                    description: 'รูปแบบ printf เช่น "%d,%.2f\\n" หรือ "%s,%d\\n"\n(จำนวน input จะปรับตาม specifier อัตโนมัติ)',
                },
            ],
            dynamicPorts({ format }) {
                const specs = getPrintfSpecifiers(format ?? '%d');
                return {
                    inputs: [
                        { id: 'inp', type: 'input', label: '➜', dataType: 'void' as const },
                        { id: 'path', type: 'input', label: 'Path', dataType: 'String', description: 'ที่อยู่ไฟล์ (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
                        ...specs.map((spec, i) => ({
                            id: `arg${i + 1}`, type: 'input' as const,
                            label: `Arg ${i + 1}`,
                            dataType: specifierToDataType(spec) as DataType,
                        })),
                    ]
                };
            },
            toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                const id = safeId(block.id);
                const path = resolveInput('path') ?? `"${(params.path ?? '/data.csv').replaceAll('"', '\\"')}"`;
                const fileMode = params.mode === 'overwrite' ? 'FILE_WRITE' : 'FILE_APPEND';
                const fmt = (params.format ?? '%d').replaceAll('"', '\\"');
                const specs = getPrintfSpecifiers(fmt);
                const args = specs.map((_, i) => resolveInput(`arg${i + 1}`) ?? '0');
                const wrapped = wrapPrintfArgs(args, specs);
                const argsPart = wrapped.length > 0 ? `, ${wrapped.join(', ')}` : '';

                return {
                    parts: [
                        [`${pad}File ${id}_f = sd_open(${path}, ${fileMode});`],
                        [`${pad}if (${id}_f) {`],
                        [`${pad}  ${id}_f.printf("${fmt}"${argsPart});`],
                        [`${pad}  ${id}_f.close();`],
                        { portId: 'ok', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'error', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },
        // ─── Write Logger ────────────────────────────────────────────────
        {
            id: 'card_write_logger',
            name: 'SD Write Logger',
            color: COLOR,
            icon: '📋',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'บันทึกข้อมูลเซ็นเซอร์ลงไฟล์ CSV\nสร้าง header row อัตโนมัติเมื่อไฟล์ใหม่\nชื่อไฟล์ = {folder}/{file_name_prefix}.csv',
            inputs: [],
            outputs: [
                { id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'เขียนสำเร็จ' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'เปิดไฟล์ไม่ได้' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                {
                    id: 'folder', type: 'text', label: 'Folder', default: '/',
                    description: 'โฟลเดอร์เก็บไฟล์ CSV เช่น / หรือ /logs',
                },
                {
                    id: 'file_name_prefix', type: 'text', label: 'File Name Prefix', default: 'data_',
                    description: 'คำขึ้นต้นชื่อไฟล์ (ต่อด้วย .csv อัตโนมัติ)',
                },
                {
                    id: 'num_values', type: 'number', label: 'Number of Value', default: '3',
                    description: 'จำนวนค่าที่บันทึกต่อแถว (1–10)',
                    validation: (n: number) => Math.min(10, Math.max(1, Math.round(n))),
                },
                // Label params — label_1 always shown, label_2..10 hidden by num_values
                { id: 'label_1', type: 'text', label: 'Label 1', default: 'Value 1' },
                { id: 'label_2', type: 'text', label: 'Label 2', default: 'Value 2', hidden: ({ params }) => Number(params.num_values ?? '3') < 2 },
                { id: 'label_3', type: 'text', label: 'Label 3', default: 'Value 3', hidden: ({ params }) => Number(params.num_values ?? '3') < 3 },
                { id: 'label_4', type: 'text', label: 'Label 4', default: 'Value 4', hidden: ({ params }) => Number(params.num_values ?? '3') < 4 },
                { id: 'label_5', type: 'text', label: 'Label 5', default: 'Value 5', hidden: ({ params }) => Number(params.num_values ?? '3') < 5 },
                { id: 'label_6', type: 'text', label: 'Label 6', default: 'Value 6', hidden: ({ params }) => Number(params.num_values ?? '3') < 6 },
                { id: 'label_7', type: 'text', label: 'Label 7', default: 'Value 7', hidden: ({ params }) => Number(params.num_values ?? '3') < 7 },
                { id: 'label_8', type: 'text', label: 'Label 8', default: 'Value 8', hidden: ({ params }) => Number(params.num_values ?? '3') < 8 },
                { id: 'label_9', type: 'text', label: 'Label 9', default: 'Value 9', hidden: ({ params }) => Number(params.num_values ?? '3') < 9 },
                { id: 'label_10', type: 'text', label: 'Label 10', default: 'Value 10', hidden: ({ params }) => Number(params.num_values ?? '3') < 10 },
            ],
            dynamicPorts(params) {
                const n = Math.min(10, Math.max(1, Number(params.num_values ?? '3')));
                return {
                    inputs: [
                        { id: 'inp', type: 'input', label: '➜', dataType: 'void' as const },
                        ...Array.from({ length: n }, (_, i) => ({
                            id: `value${i + 1}`,
                            type: 'input' as const,
                            label: params[`label_${i + 1}`] || `Value ${i + 1}`,
                            dataType: 'any' as DataType,
                        })),
                    ]
                };
            },
            toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor, registerFunction, registerGlobal }) {
                registerSDBase(registerPreprocessor, registerFunction);

                registerGlobal('extern struct tm timeinfo;');

                const id = safeId(block.id);
                const n = Math.min(10, Math.max(1, Number(params.num_values ?? '3')));

                // Build file path at code-gen time
                const folder = (params.folder ?? '/').replace(/\/+$/, '');
                const prefix = (params.file_name_prefix ?? 'data_').replaceAll('"', '\\"');

                // CSV header row from label params
                const header = Array.from({ length: n }, (_, i) =>
                    (params[`label_${i + 1}`] ?? `Value ${i + 1}`).replaceAll('"', '\\"').replaceAll(',', ' ')
                ).join(',');

                // Data row: String(value1) + "," + String(value2) + ...
                const dataParts = Array.from({ length: n }, (_, i) =>
                    `String(${resolveInput(`value${i + 1}`) ?? '0'})`
                ).join(' + "," + ');

                return {
                    parts: [
                        [
                            `${pad}{ // SD Write Logger : folder=${folder}, prefix=${prefix}`,
                            `${pad}  String ${id}_path;`,
                            `${pad}  {`,
                            `${pad}    char buff_date[32];`,
                            `${pad}    snprintf(buff_date, sizeof(buff_date), "%d-%d-%d", timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);`,
                            `${pad}    ${id}_path = String("${folder}") + "/${prefix}" + String(buff_date) + ".csv";`,
                            `${pad}  }`,
                            `${pad}  bool ${id}_new = sd_init() && !Card.exists(${id}_path);`,
                            `${pad}  File ${id}_f = sd_open(${id}_path, FILE_APPEND);`,
                            `${pad}  if (${id}_f) {`,
                            `${pad}    if (${id}_new) ${id}_f.println("time,${header}");`,
                            `${pad}    {`,
                            `${pad}      char buff_time[32];`,
                            `${pad}      snprintf(buff_time, sizeof(buff_time), "%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);`,
                            `${pad}      ${id}_f.print(buff_time);`,
                            `${pad}      ${id}_f.print(",");`,
                            `${pad}    }`,
                            `${pad}    ${id}_f.println(${dataParts});`,
                            `${pad}    ${id}_f.close();`,
                        ],
                        { portId: 'ok', depthDelta: 2 },
                        [`${pad}  } else {`],
                        { portId: 'error', depthDelta: 2 },
                        [
                            `${pad}  }`,
                            `${pad}}`,
                        ],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Read ────────────────────────────────────────────────────────
        {
            id: 'card_read',
            name: 'SD Read',
            color: COLOR,
            icon: '📖',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'อ่านไฟล์ทั้งหมดเป็น String\nเหมาะสำหรับไฟล์ config หรือไฟล์ขนาดเล็ก',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'content', type: 'output', label: 'Content', dataType: 'String', description: 'เนื้อหาทั้งหมดของไฟล์' },
                { id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'เปิดไฟล์ไม่ได้' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                {
                    id: 'path', type: 'text', label: 'File Path', default: '/config.txt',
                    description: 'path ของไฟล์ ขึ้นต้นด้วย /',
                },
            ],
            toCode({ pad, block, safeId, params, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                const id = safeId(block.id);
                const path = (params.path ?? '/config.txt').replaceAll('"', '\\"');

                return {
                    parts: [
                        [`${pad}File ${id}_f = sd_open("${path}", FILE_READ);`],
                        [`${pad}if (${id}_f) {`],
                        [`${pad}  String ${id} = f.readString();`],
                        [`${pad}  f.close();`],
                        { portId: 'content', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'error', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Exists ──────────────────────────────────────────────────────
        {
            id: 'card_exists',
            name: 'SD Exists',
            color: COLOR,
            icon: '🔍',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'ตรวจสอบว่าไฟล์หรือ directory มีอยู่ใน SD Card หรือไม่',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [
                { id: 'exists', type: 'output', label: 'Exists', dataType: 'void', description: 'มีไฟล์/directory' },
                { id: 'missing', type: 'output', label: 'Not Exists', dataType: 'void', description: 'ไม่มีไฟล์/directory' },
                { id: 'out', type: 'output', label: '➜', dataType: 'void' },
            ],
            params: [
                { id: 'path', type: 'text', label: 'Path', default: '/data.csv' },
            ],
            toCode({ pad, params, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);

                const path = (params.path ?? '/data.csv').replaceAll('"', '\\"');

                registerFunction(
                    'void sd_exists(const String &path)',
                    [
                        `  if (!sd_init()) return false;`,
                        `  return Card.exists(path);`,
                    ].join('\n'),
                    'void sd_exists(const String &path) ;'
                );

                return {
                    parts: [
                        [`${pad}if (sd_exists("${path}")) {`],
                        { portId: 'exists', depthDelta: 1 },
                        [`${pad}} else {`],
                        { portId: 'missing', depthDelta: 1 },
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Remove ──────────────────────────────────────────────────────
        {
            id: 'card_remove',
            name: 'SD Remove',
            color: COLOR,
            icon: '🗑️',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'ลบไฟล์ออกจาก SD Card',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                { id: 'path', type: 'text', label: 'File Path', default: '/data.csv' },
            ],
            toCode({ pad, params, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);
                const path = (params.path ?? '/data.csv').replaceAll('"', '\\"');
                return {
                    parts: [
                        [`${pad}if (sd_init()) {`],
                        [`${pad}  Card.remove("${path}");`],
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Mkdir ───────────────────────────────────────────────────────
        {
            id: 'card_mkdir',
            name: 'SD Mkdir',
            color: COLOR,
            icon: '📁',
            category: 'SD Card',
            requires: ['card_begin'],
            description: 'สร้าง directory ใน SD Card',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                { id: 'path', type: 'text', label: 'Directory Path', default: '/logs' },
            ],
            toCode({ pad, params, registerPreprocessor, registerFunction }) {
                registerSDBase(registerPreprocessor, registerFunction);
                const path = (params.path ?? '/logs').replaceAll('"', '\\"');
                return {
                    parts: [
                        [`${pad}if (sd_init()) {`],
                        [`${pad}  Card.mkdir("${path}");`],
                        [`${pad}}`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },
    ]
};
