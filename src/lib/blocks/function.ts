import type { BlockCategory } from './types.js';

export const functionCategory: BlockCategory = {
	name: 'Function',
	blocks: [
		{
			id: 'call_function',
			name: 'Call Function',
			color: '#fb923c',
			icon: '📞',
			category: 'action',
			description: 'เรียกใช้ฟังก์ชัน C ที่กำหนดชื่อ ฟังก์ชันต้องถูกสร้างด้วยบล็อก Make Function ก่อน',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปหลังเรียกฟังก์ชัน' }],
			params: [{ id: 'fn_name', type: 'text', label: 'Function Name', default: 'my_fn1'}],
			toCode({ pad, params }) {
				const fn_name = params.fn_name ?? '';
				return {
					parts: [
						[`${pad}${fn_name}();`],
						{ portId: 'return', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'make_function',
			name: 'Make Function',
			trigger: true,
			color: '#fb923c',
			icon: 'ƒ',
			category: 'action',
			description: 'สร้างฟังก์ชัน C ใหม่ที่สามารถเรียกซ้ำได้ด้วย Call Function โค้ดภายในจะถูก emit ท้ายไฟล์',
			inputs: [ ],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'any', description: 'โค้ดที่จะอยู่ภายในฟังก์ชันที่สร้าง' }],
			params: [{ id: 'fn_name', type: 'text', label: 'Function Name', default: 'my_fn1'}],
			toCode({ block, pad, params, captureCode, registerFunction }) {
				const fn_name = params.fn_name ?? '';
				const body = captureCode('out', 1);
				registerFunction(
					`void ${fn_name}()`,
					body,
					`void ${fn_name}();`
				);
				return {
					parts: [

					]
				};
			}
		},
	]
};
