import type { BlockCategory } from './types.js';

export const controlCategory: BlockCategory = {
	name: 'Control',
	blocks: [
		{
			id: 'delay',
			name: 'Delay',
			color: '#84cc16',
			icon: '⏱',
			category: 'action',
			description: 'หยุดรอตามเวลาที่กำหนด (milliseconds) ก่อนดำเนินการต่อ (delay)',
			inputs: [
				{ id: 'in', type: 'input', label: 'In', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
			],
			outputs: [{ id: 'out', type: 'output', label: 'Out', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปหลังหมดเวลา' }],
			params: [{ id: 'time', type: 'number', label: 'Time (mS)', default: '1000' }],
			toCode({ pad, params }) {
				const time = params.time ?? '1000';
				return {
					parts: [
						[`${pad}delay(${time});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'condition',
			name: 'Condition',
			color: '#f59e0b',
			icon: '?',
			category: 'logic',
			description: 'แยกสายการทำงานตามเงื่อนไข (if/else) — ตรวจสอบค่าจาก Input กับเงื่อนไขที่กำหนด',
			inputs: [{ id: 'in', type: 'input', label: 'In', dataType: 'any', description: 'ค่าที่นำมาเปรียบเทียบกับเงื่อนไข' }],
			outputs: [
				{ id: 'true', type: 'output', label: 'True', dataType: 'void', description: 'รันเมื่อเงื่อนไขเป็น true' },
				{ id: 'false', type: 'output', label: 'False', dataType: 'void', description: 'รันเมื่อเงื่อนไขเป็น false' }
			],
			params: [
				{ id: 'condition', type: 'text', default: '== 1' }
			],
			toCode({ pad, resolveInput, params }) {
				const condition = params.condition ?? '== true';
				const inp = resolveInput('in') ?? 'true';
				return {
					parts: [
						[`${pad}if (${[inp, condition].join(' ')}) {`],
						{ portId: 'true', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'false', depthDelta: 1 },
						[`${pad}}`]
					]
				};
			}
		},
		{
			id: 'while_loop',
			name: 'Infinity Loop',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			description: 'วนลูปซ้ำไม่มีที่สิ้นสุด (while(1)) โปรแกรมจะค้างอยู่ในลูปนี้ตลอด',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body', dataType: 'void', description: 'โค้ดที่รันซ้ำในแต่ละรอบของลูป' },
				{ id: 'done', type: 'output', label: 'Done', dataType: 'void', description: 'โค้ดหลังออกจากลูป (ไม่สามารถเข้าถึงได้ในลูปนี้)' }
			],
			toCode({ pad, resolveInput }) {
				return {
					parts: [
						[`${pad}while (1) {`],
						{ portId: 'body', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'done', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'for_loop',
			name: 'For Loop',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			description: 'วนลูปตามจำนวนครั้งที่กำหนด (for loop) ใช้ตัวแปร i นับรอบ',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body', dataType: 'void', description: 'โค้ดที่รันในแต่ละรอบ (มีตัวแปร i ให้ใช้)' },
				{ id: 'done', type: 'output', label: 'Done', dataType: 'void', description: 'โค้ดที่รันหลังวนครบทุกรอบ' }
			],
			params: [
				{ id: 'count', type: 'number', label: 'Loop count', default: '10' }
			],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}for (int i=0;i<${count};i++) {`],
						{ portId: 'body', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'done', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'loop_break',
			name: 'Loop Break',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			description: 'หยุดการวนลูปทันที (break) ออกจาก for หรือ while loop ที่ครอบอยู่',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}break;`],
					]
				};
			}
		},
		{
			id: 'loop_continue',
			name: 'Loop Continue',
			color: '#06b6d4',
			icon: '↻',
			category: 'logic',
			description: 'ข้ามโค้ดที่เหลือในรอบนี้แล้วไปเริ่มรอบถัดไปทันที (continue)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [],
			toCode({ pad, params }) {
				const count = params.count ?? '10';
				return {
					parts: [
						[`${pad}continue;`],
					]
				};
			}
		},
		{
			id: 'switch',
			name: 'Switch',
			color: '#e879f9',
			icon: '⇌',
			category: 'logic',
			description: 'แยกทิศทางการทำงานตามค่าตัวเลข (switch/case) รองรับ 2 case และ default',
			inputs: [{ id: 'in', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าตัวเลขที่ใช้ตรวจสอบในแต่ละ case' }],
			outputs: [
				{ id: 'case1', type: 'output', label: 'Case 1', dataType: 'void', description: 'รันเมื่อค่าเท่ากับ 1' },
				{ id: 'case2', type: 'output', label: 'Case 2', dataType: 'void', description: 'รันเมื่อค่าเท่ากับ 2' },
				{ id: 'default', type: 'output', label: 'Default', dataType: 'void', description: 'รันเมื่อค่าไม่ตรงกับ case ใดเลย' }
			],
			toCode({ pad, resolveInput }) {
				let val = resolveInput('in') ?? '-1'
				return {
					parts: [
						[`${pad}switch (${val}) {`],
						[`${pad}    case 1:`],
						{ portId: 'case1', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}    case 2:`],
						{ portId: 'case2', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}    default:`],
						{ portId: 'default', depthDelta: 2 },
						[`${pad}        break;`],
						[`${pad}}`]
					]
				};
			}
		},
	]
};
