import type { BlockCategory, DataType } from './types.js';

const COLOR = '#fb923c'; // orange-400

const FUNC_RETURN_TYPES = [
    { label: 'void',   value: 'void'   },
    { label: 'int',    value: 'int'    },
    { label: 'float',  value: 'float'  },
    { label: 'String', value: 'String' },
    { label: 'bool',   value: 'bool'   },
    { label: 'long',   value: 'long'   },
];

const PARAM_TYPES = [
    { label: 'int',    value: 'int'    },
    { label: 'float',  value: 'float'  },
    { label: 'String', value: 'String' },
    { label: 'bool',   value: 'bool'   },
    { label: 'long',   value: 'long'   },
];

function parseFuncRegistry(params: Record<string, string | string[]>): Record<string, {
    returnType: string;
    params: { name: string; type: string }[];
}> {
    try { return JSON.parse(params.__funcRegistry as string ?? '{}'); } catch { return {}; }
}

export const functionCategory: BlockCategory = {
    name: 'Function',
    blocks: [
        // ─── Function Define ─────────────────────────────────────────
        {
            id: 'func_define',
            name: 'Function Define',
            trigger: true,
            color: COLOR,
            icon: 'ƒ',
            category: 'function',
            description: 'กำหนดฟังก์ชั่นที่รับ parameter และ return ค่าได้\nใช้ Function Get Param เพื่ออ่านค่า parameter\nใช้ Function Return เพื่อ return ค่า',
            inputs: [],
            outputs: [{ id: 'body', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                {
                    id: 'func_name', type: 'varname' as const, category: 'user_func',
                    label: 'Function Name', default: 'myFunc',
                },
                {
                    id: 'return_type', type: 'option' as const, label: 'Return Type',
                    default: 'void', options: FUNC_RETURN_TYPES,
                },
                {
                    id: 'param_count', type: 'option' as const, label: 'Parameters', default: '0',
                    options: [
                        { label: 'None (0)', value: '0' },
                        { label: '1', value: '1' }, { label: '2', value: '2' },
                        { label: '3', value: '3' }, { label: '4', value: '4' },
                        { label: '5', value: '5' }, { label: '6', value: '6' },
                    ],
                },
                ...Array.from({ length: 6 }, (_, i) => {
                    const hide = ({ params }: { params: Record<string, string> }) =>
                        Number(params.param_count ?? '0') <= i;
                    return [
                        { id: `param${i + 1}_name`, type: 'text' as const, label: `Param ${i + 1} Name`, default: `p${i + 1}`, hidden: hide },
                        { id: `param${i + 1}_type`, type: 'option' as const, label: `Param ${i + 1} Type`, default: 'int', options: PARAM_TYPES, hidden: hide },
                    ];
                }).flat(),
            ],
            toCode({ pad, params, captureCode, registerFunction }) {
                const funcName   = (params.func_name   as string) ?? 'myFunc';
                const returnType = (params.return_type as string) ?? 'void';
                const count      = Math.min(6, Math.max(0, Number(params.param_count ?? '0')));
                const paramList  = Array.from({ length: count }, (_, i) => {
                    const pname = (params[`param${i + 1}_name`] as string) ?? `p${i + 1}`;
                    const ptype = (params[`param${i + 1}_type`] as string) ?? 'int';
                    return `${ptype} ${pname}`;
                }).join(', ');
                const signature  = `${returnType} ${funcName}(${paramList})`;
                const body       = captureCode('body', 1) ?? '';
                registerFunction(signature, body, `${signature};`);
                return { parts: [] };
            }
        },

        // ─── Function Get Param ──────────────────────────────────────
        {
            id: 'func_get_param',
            name: 'Function Get Param',
            color: COLOR,
            icon: 'ƒ↑',
            category: 'function',
            description: 'ดึงค่า parameter ของฟังก์ชั่นมาใช้\nวางได้ทุกที่ใน body ของฟังก์ชั่น',
            inputs: [{ id: 'in',    type: 'input', label: '➜',     dataType: 'any' }],
            outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'any' }],
            params: [
                { id: 'func_name', type: 'varname' as const, category: 'user_func', label: 'Function', default: 'myFunc' },
                {
                    id: 'param_name', type: 'option' as const, label: 'Param',
                    default: '',
                    options(params: Record<string, string>) {
                        const reg = parseFuncRegistry(params);
                        const sig = reg[params.func_name ?? ''];
                        if (!sig?.params.length) return [{ label: '(no params)', value: '' }];
                        return sig.params.map(p => ({ label: `${p.name}: ${p.type}`, value: p.name }));
                    },
                },
            ],
            dynamicPorts(params) {
                const reg = parseFuncRegistry(params);
                const sig = reg[params.func_name ?? ''];
                const p   = sig?.params.find(p => p.name === params.param_name);
                const dt  = (p?.type ?? 'any') as DataType;
                return { outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: dt }] };
            },
            toExpr(params) {
                return params.param_name || 'undefined_param';
            },
            toCode({ registerPreprocessor: _r }) {
                return { parts: [] };
            }
        },

        // ─── Function Return ─────────────────────────────────────────
        {
            id: 'func_return',
            name: 'Function Return',
            color: COLOR,
            icon: 'ƒ↩',
            category: 'function',
            description: 'Return ค่ากลับจากฟังก์ชั่น\nวางใน body ของ Function Define',
            inputs: [
                { id: 'in',    type: 'input', label: '➜',     dataType: 'any' },
                { id: 'value', type: 'input', label: 'Value',  dataType: 'any', description: 'ค่าที่จะ return (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
            ],
            outputs: [],
            params: [
                { id: 'func_name', type: 'varname' as const, category: 'user_func', label: 'Function', default: 'myFunc' },
                { id: 'value', type: 'text' as const, label: 'Value', default: '0', description: 'ใช้เมื่อไม่มีบล็อกต่อเข้า Value' },
            ],
            dynamicPorts(params) {
                const reg = parseFuncRegistry(params);
                const sig = reg[params.func_name ?? ''];
                const dt  = (sig?.returnType ?? 'any') as DataType;
                return {
                    inputs: [
                        { id: 'in',    type: 'input', label: '➜',    dataType: 'any' },
                        { id: 'value', type: 'input', label: 'Value', dataType: dt,
                          description: 'ค่าที่จะ return (ถ้าไม่ต่อสาย ใช้ค่าจาก param)' },
                    ],
                };
            },
            toCode({ pad, params, resolveInput }) {
                const val = resolveInput('value') ?? (params.value as string ?? '0');
                return {
                    parts: [
                        [`${pad}return ${val};`],
                        { portId: 'out', depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Function Call ───────────────────────────────────────────
        {
            id: 'func_call',
            name: 'Function Call',
            color: COLOR,
            icon: '📞',
            category: 'function',
            description: 'เรียกใช้ฟังก์ชั่นที่สร้างด้วย Function Define\nส่ง argument เข้าทาง input port และรับค่า return ทาง output',
            inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [
                { id: 'func_name', type: 'varname' as const, category: 'user_func', label: 'Function', default: 'myFunc' },
            ],
            dynamicPorts(params) {
                const reg = parseFuncRegistry(params);
                const sig = reg[params.func_name as string ?? ''];
                const argInputs = (sig?.params ?? []).map((p, i) => ({
                    id: `arg${i}`, type: 'input' as const, label: p.name,
                    dataType: (p.type ?? 'any') as DataType,
                }));
                const resultOutput = sig && sig.returnType !== 'void'
                    ? [{ id: 'result', type: 'output' as const, label: 'Result', dataType: (sig.returnType ?? 'any') as DataType }]
                    : [];
                return {
                    inputs:  [{ id: 'in', type: 'input' as const, label: '➜', dataType: 'any' }, ...argInputs],
                    outputs: [...resultOutput, { id: 'out', type: 'output' as const, label: '➜', dataType: 'void' }],
                };
            },
            toCode({ pad, block, safeId, params, resolveInput }) {
                const reg      = parseFuncRegistry(params);
                const funcName = (params.func_name as string) ?? 'myFunc';
                const sig      = reg[funcName];
                const args     = (sig?.params ?? []).map((_: any, i: number) => resolveInput(`arg${i}`) ?? '0');
                const call     = `${funcName}(${args.join(', ')})`;

                if (!sig || sig.returnType === 'void') {
                    return { parts: [[`${pad}${call};`], { portId: 'out', depthDelta: 0 }] };
                }
                const id = safeId(block.id);
                return {
                    parts: [
                        [`${pad}${sig.returnType} ${id} = ${call};`],
                        { portId: 'result', depthDelta: 0 },
                        { portId: 'out',    depthDelta: 0 },
                    ]
                };
            }
        },

        // ─── Legacy: Make Function (no params, no return) ────────────
        {
            id: 'make_function',
            name: 'Make Function',
            trigger: true,
            color: COLOR,
            icon: 'ƒ+',
            category: 'function',
            description: 'สร้างฟังก์ชัน C แบบ void ง่าย ๆ ไม่มี parameter\nใช้ Call Function เพื่อเรียก',
            inputs: [],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'any' }],
            params: [{ id: 'fn_name', type: 'text' as const, label: 'Function Name', default: 'myFn' }],
            toCode({ params, captureCode, registerFunction }) {
                const fn_name = (params.fn_name as string) ?? '';
                const body = captureCode('out', 1);
                registerFunction(`void ${fn_name}()`, body, `void ${fn_name}();`);
                return { parts: [] };
            }
        },

        // ─── Legacy: Call Function (no args) ─────────────────────────
        {
            id: 'call_function',
            name: 'Call Function',
            color: COLOR,
            icon: '↩ƒ',
            category: 'function',
            description: 'เรียกใช้ฟังก์ชัน C ที่สร้างด้วย Make Function',
            inputs:  [{ id: 'in',  type: 'input',  label: '➜', dataType: 'any'  }],
            outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
            params: [{ id: 'fn_name', type: 'text' as const, label: 'Function Name', default: 'myFn' }],
            toCode({ pad, params }) {
                const fn_name = (params.fn_name as string) ?? '';
                return { parts: [[`${pad}${fn_name}();`], { portId: 'out', depthDelta: 0 }] };
            }
        },
    ]
};
