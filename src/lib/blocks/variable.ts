import type { BlockCategory } from './types.js';

// ── Variable blocks (Get / Set) ───────────────────────────────────────────
export const variableCategory: BlockCategory = {
    name: 'Variable',
    blocks: [
		{
			id: 'var_get_int',
			name: 'Get Int',
			color: '#3b82f6',
			icon: 'x',
			category: 'data',
			description: 'อ่านค่าตัวแปร Integer — ใส่ชื่อตัวแปรให้ตรงกับ Set Int',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
            ],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าของตัวแปร Integer' }],
			params: [{ id: 'name', type: 'varname', category: 'var_int', label: 'Variable', default: 'myInt' }],
			toExpr(params) { return params.name || 'myInt'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'var_set_int',
			name: 'Set Int',
			color: '#3b82f6',
			icon: 'x=',
			category: 'data',
			description: 'กำหนดค่าตัวแปร Integer และประกาศ global variable',
			inputs: [
				{ id: 'exec', type: 'input', label: '➜', dataType: 'void', description: 'สายลำดับการทำงาน' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าที่ต้องการกำหนดให้ตัวแปร' }
			],
			outputs: [{ id: 'exec', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานต่อ' }],
			params: [
				{ id: 'name', type: 'varname', category: 'var_int', label: 'Variable', default: 'myInt' },
				{ id: 'init', type: 'number', label: 'Initial Value', default: '0' }
			],
			toCode({ pad, resolveInput, params, registerGlobal }) {
				const name = params.name || 'myInt';
				const init = params.init || '0';
				registerGlobal(`static int ${name} = ${init};`);
				const value = resolveInput('value') ?? init;
				return {
					parts: [
						[`${pad}${name} = ${value};`],
						{ portId: 'exec', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'var_get_float',
			name: 'Get Float',
			color: '#8b5cf6',
			icon: 'x.',
			category: 'data',
			description: 'อ่านค่าตัวแปร Float — ใส่ชื่อตัวแปรให้ตรงกับ Set Float',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
            ],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'float', description: 'ค่าของตัวแปร Float' }],
			params: [{ id: 'name', type: 'varname', category: 'var_float', label: 'Variable', default: 'myFloat' }],
			toExpr(params) { return params.name || 'myFloat'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'var_set_float',
			name: 'Set Float',
			color: '#8b5cf6',
			icon: 'x.=',
			category: 'data',
			description: 'กำหนดค่าตัวแปร Float และประกาศ global variable',
			inputs: [
				{ id: 'exec', type: 'input', label: '➜', dataType: 'void', description: 'สายลำดับการทำงาน' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'float', description: 'ค่าที่ต้องการกำหนดให้ตัวแปร' }
			],
			outputs: [{ id: 'exec', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานต่อ' }],
			params: [
				{ id: 'name', type: 'varname', category: 'var_float', label: 'Variable', default: 'myFloat' },
				{ id: 'init', type: 'number', label: 'Initial Value', default: '0.0' }
			],
			toCode({ pad, resolveInput, params, registerGlobal }) {
				const name = params.name || 'myFloat';
				const rawInit = params.init || '0.0';
				const initLit = rawInit.includes('.') ? `${rawInit}f` : `${rawInit}.0f`;
				registerGlobal(`static float ${name} = ${initLit};`);
				const value = resolveInput('value') ?? initLit;
				return {
					parts: [
						[`${pad}${name} = ${value};`],
						{ portId: 'exec', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'var_get_string',
			name: 'Get String',
			color: '#ef4444',
			icon: '"x',
			category: 'data',
			description: 'อ่านค่าตัวแปร String — ใส่ชื่อตัวแปรให้ตรงกับ Set String',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
            ],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'String', description: 'ค่าของตัวแปร String' }],
			params: [{ id: 'name', type: 'varname', category: 'var_string', label: 'Variable', default: 'myString' }],
			toExpr(params) { return params.name || 'myString'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'var_set_string',
			name: 'Set String',
			color: '#ef4444',
			icon: '"x=',
			category: 'data',
			description: 'กำหนดค่าตัวแปร String และประกาศ global variable',
			inputs: [
				{ id: 'exec', type: 'input', label: '➜', dataType: 'void', description: 'สายลำดับการทำงาน' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'String', description: 'ค่าที่ต้องการกำหนดให้ตัวแปร' }
			],
			outputs: [{ id: 'exec', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานต่อ' }],
			params: [
				{ id: 'name', type: 'varname', category: 'var_string', label: 'Variable', default: 'myString' },
				{ id: 'init', type: 'text', label: 'Initial Value', default: '' }
			],
			toCode({ pad, resolveInput, params, registerGlobal }) {
				const name = params.name || 'myString';
				const initEscaped = (params.init ?? '').replaceAll('"', '\\"');
				registerGlobal(`static String ${name} = "${initEscaped}";`);
				const value = resolveInput('value') ?? `"${initEscaped}"`;
				return {
					parts: [
						[`${pad}${name} = ${value};`],
						{ portId: 'exec', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'var_get_bool',
			name: 'Get Bool',
			color: '#f59e0b',
			icon: '✓x',
			category: 'data',
			description: 'อ่านค่าตัวแปร Boolean — ใส่ชื่อตัวแปรให้ตรงกับ Set Bool',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
            ],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'bool', description: 'ค่าของตัวแปร Boolean' }],
			params: [{ id: 'name', type: 'varname', category: 'var_bool', label: 'Variable', default: 'myBool' }],
			toExpr(params) { return params.name || 'myBool'; },
			toCode() { return { parts: [] }; }
		},
		{
			id: 'var_set_bool',
			name: 'Set Bool',
			color: '#f59e0b',
			icon: '✓=',
			category: 'data',
			description: 'กำหนดค่าตัวแปร Boolean และประกาศ global variable',
			inputs: [
				{ id: 'exec', type: 'input', label: '➜', dataType: 'void', description: 'สายลำดับการทำงาน' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'bool', description: 'ค่าที่ต้องการกำหนดให้ตัวแปร' }
			],
			outputs: [{ id: 'exec', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานต่อ' }],
			params: [
				{ id: 'name', type: 'varname', category: 'var_bool', label: 'Variable', default: 'myBool' },
				{
					id: 'init',
					type: 'option',
					label: 'Initial Value',
					options: [
						{ label: 'false', value: 'false' },
						{ label: 'true', value: 'true' }
					]
				}
			],
			toCode({ pad, resolveInput, params, registerGlobal }) {
				const name = params.name || 'myBool';
				const init = params.init === 'true' ? 'true' : 'false';
				registerGlobal(`static bool ${name} = ${init};`);
				const value = resolveInput('value') ?? init;
				return {
					parts: [
						[`${pad}${name} = ${value};`],
						{ portId: 'exec', depthDelta: 0 }
					]
				};
			}
		},
    ]
};

