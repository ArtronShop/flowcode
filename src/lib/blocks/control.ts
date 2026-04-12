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
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปหลังหมดเวลา' }],
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
			id: 'Filter',
			name: 'Filter',
			color: '#f59e0b',
			icon: '⛛',
			category: 'logic',
			description: 'กรองเฉพาะข้อมูลตามเงื่อนไขเท่านั้นที่จะทำให้บล็อกถัดไปทำงาน',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'ค่าที่นำมาเปรียบเทียบกับเงื่อนไข' }],
			outputs: [
				{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'บล็อกที่ต้องการให้ทำงานเมื่อเงื่อนไขผ่าน' },
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
						{ portId: 'out', depthDelta: 1 },
						[`${pad}}`],
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
			toCode({ pad }) {
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'count', type: 'input', label: 'Count', dataType: 'int', description: 'จำนวนรอบ (ตัวเลือก)' }
			],
			outputs: [
				{ id: 'body', type: 'output', label: 'Body', dataType: 'void', description: 'โค้ดที่รันในแต่ละรอบ (มีตัวแปร i ให้ใช้)' },
				{ id: 'done', type: 'output', label: 'Done', dataType: 'void', description: 'โค้ดที่รันหลังวนครบทุกรอบ' }
			],
			params: [
				{ id: 'count', type: 'number', label: 'Loop count', default: '10', description: 'จำนวนรอบ' }
			],
			toCode({ pad, resolveInput, params }) {
				const count = resolveInput('count') ?? params.count ?? '10';
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
			icon: '◼',
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
			icon: '⏭',
			category: 'logic',
			description: 'ข้ามโค้ดที่เหลือในรอบนี้แล้วไปเริ่มรอบถัดไปทันที (continue)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [],
			toCode({ pad, params }) {
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
			description: 'แยกทิศทางการทำงานตามค่าตัวเลข (switch/case) รองรับหลาย case และ default',
			inputs: [{ id: 'in', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าตัวเลขที่ใช้ตรวจสอบในแต่ละ case' }],
			outputs: [{ id: 'default', type: 'output', label: 'Default', dataType: 'void', description: 'รันเมื่อค่าไม่ตรงกับ case ใดเลย' }],
			params: [{ id: 'cases', type: 'number', label: 'จำนวน Case', default: '2', validation: (n: number) => Math.max(1, Math.min(10, n)), description: 'จำนวน case ที่ต้องการตรวจสอบ' }],
			dynamicPorts({ cases }) {
				const n = Math.max(1, Math.min(10, parseInt(cases) || 2));
				return {
					outputs: [
						...Array.from({ length: n }, (_, i) => ({
							id: `case${i+1}`, type: 'output' as const, label: `Case ${i+1}`, dataType: 'void' as const
						})),
						{ id: 'default', type: 'output' as const, label: 'Default', dataType: 'void' as const }
					]
				};
			},
			toCode({ pad, resolveInput, params }) {
				let val = resolveInput('in') ?? '-1'
				const n = parseInt(params.cases);
				const caseStatement: any[] = [];
				for (let i=1;i<=n;i++) {
					caseStatement.push([`${pad}  case ${i}:`]);
					caseStatement.push({ portId: `case${i}`, depthDelta: 2 });
					caseStatement.push([`${pad}    break;`]);
				}
				return {
					parts: [
						[`${pad}switch (${val}) {`],
						...caseStatement,
						[`${pad}  default:`],
						{ portId: 'default', depthDelta: 2 },
						[`${pad}    break;`],
						[`${pad}}`]
					]
				};
			}
		},

		// ─── Wait All ─────────────────────────────────────────────────────
		{
			id: 'wait_all',
			name: 'Wait All',
			color: '#64748b',
			icon: '⏳',
			category: 'control',
			description:
				'รอให้ทุก branch ที่ต่อเข้ามาทำงานก่อน แล้วค่อยดำเนินการต่อ\n' +
				'ตัวบล็อกเองไม่สร้างโค้ด — รับรองแค่ลำดับการ traverse ว่าทุก Input จะถูกสร้างก่อน Output',
			inputs: [
				{ id: 'in',  type: 'input', label: '➜', dataType: 'any', description: 'สาย flow หลัก' },
				{ id: 'in2', type: 'input', label: '➜', dataType: 'any', description: 'สาย flow เพิ่มเติม 2' },
				{ id: 'in3', type: 'input', label: '➜', dataType: 'any', description: 'สาย flow เพิ่มเติม 3' },
				{ id: 'in4', type: 'input', label: '➜', dataType: 'any', description: 'สาย flow เพิ่มเติม 4' },
			],
			outputs: [
				{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ดำเนินการต่อหลังจาก Input ทั้งหมดถูก traverse แล้ว' },
			],
			toCode({ pad }) {
				return {
					parts: [
						// traverse ทุก wait input ก่อนดำเนินการต่อ
						{ waitPortId: 'in2' },
						{ waitPortId: 'in3' },
						{ waitPortId: 'in4' },
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
	]
};
