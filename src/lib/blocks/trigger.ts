import type { BlockCategory } from './types.js';

export const triggerCategory: BlockCategory = {
	name: 'Trigger',
	blocks: [
		{
			id: 'on_boot',
			trigger: true,
			name: 'On Boot',
			color: '#22c55e',
			icon: '▶',
			category: 'trigger',
			description: 'รันโค้ดครั้งเดียวเมื่อบอร์ดเปิดหรือรีเซ็ต ใช้สำหรับตั้งค่าเริ่มต้น (Arduino setup())',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานถัดไป' }],
			toCode({ block, safeId, captureCode, registerFunction, pad }) {
				/*const id = safeId(block.id);
				const fn = `task_${id}`;
				const body = captureCode('out', 1);
				registerFunction(
					`void ${fn}(void* pvParameters)`,
					body + '\n\n' + pad + 'vTaskDelete(NULL);',
					`void ${fn}(void* pvParameters);`
				);*/
				return {
					parts: [
						// [`${pad}xTaskCreate(${fn}, "${fn}", 8192, NULL, 5, NULL);`]
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'schedule',
			trigger: true,
			name: 'Schedule',
			color: '#16a34a',
			icon: '⏰',
			category: 'trigger',
			description: 'รันโค้ดซ้ำตามช่วงเวลาที่กำหนด โดยใช้ FreeRTOS Task ทำงานอยู่เบื้องหลัง',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานที่รันซ้ำในแต่ละรอบเวลา' }],
			params: [
				{
					id: 'interval',
					type: 'option',
					options: [
						{ label: "every 0.1 second", value: "100" },
						{ label: "every 0.5 seconds", value: "500" },
						{ label: "every 1 second", value: "1 * 1000" },
						{ label: "every 2 second", value: "2 * 1000" },
						{ label: "every 5 seconds", value: "5 * 1000" },
						{ label: "every 10 seconds", value: "10 * 1000" },
						{ label: "every 30 seconds", value: "30 * 1000" },
						{ label: "every 1 mins", value: "60 * 1000" },
						{ label: "every 2 mins", value: "2 * 60 * 1000" },
						{ label: "every 5 mins", value: "5 * 60 * 1000" },
						{ label: "every 10 mins", value: "10 * 60 * 1000" },
						{ label: "every 30 mins", value: "30 * 60 * 1000" },
						{ label: "every 1 hours", value: "60 * 60 * 1000" },
						{ label: "Custom", value: "CUSTOM" },
					],
					default: '1 * 1000',
					description: 'ช่วงเวลาที่ทำซ้ำ (1 วินาที ถึง 1 ชั่วโมง)'
				},
				{
					id: 'custom',
					label: 'Interval (ms)',
					type: 'number',
					default: '1000',
					validation: (n) => Math.max(1, Math.trunc(n)),
					hidden: ({ params }) => params.interval !== 'CUSTOM'
				}
			],
			toCode({ block, params, safeId, captureCode, registerPollingCode, pad }) {
				const id = safeId(block.id);
				const interval = params.interval === 'CUSTOM' ? (params.custom ?? '1000') : (params.interval ?? '1000');
				const body = captureCode('out', 1);

				registerPollingCode([
					`{ // Schedule ${interval} ms (${id})`,
					`  static uint32_t timer = 0;`,
					`  if ((timer == 0) || ((millis() - timer) >= (${interval})) || (millis() < timer)) {`,
					`    timer = millis();`,
					...body.split('\n').map(l => `  ${l}`),
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
			id: 'interruppt',
			trigger: true,
			name: 'Interruppt',
			color: '#16a34a',
			icon: '🔔',
			category: 'trigger',
			description: 'รันโค้ดทันทีเมื่อมีสัญญาณ Interrupt บนขา GPIO ที่กำหนด (attachInterrupt)',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'สายลำดับการทำงานที่รันเมื่อเกิด Interrupt' }],
			params: [
				{
					id: 'pin',
					label: 'Pin',
					type: 'number',
					default: '2',
					validation: (n: number) => Math.trunc(Math.max(0, n)),
					description: 'ขา GPIO ที่ต้องการตรวจจับการเปลี่ยนแปลง',
				},
				{
					id: 'mode',
					label: 'Mode',
					type: 'option',
					options: [
						{ label: "LOW", value: "LOW" },
						{ label: "CHANGE", value: "CHANGE" },
						{ label: "RISING", value: "RISING" },
						{ label: "FALLING", value: "FALLING" },
					],
					description: 'รูปแบบการตรวจจับ (LOW / CHANGE / RISING / FALLING)'
				}
			],
			toCode({ block, params, safeId, captureCode, registerFunction, pad }) {
				const id = safeId(block.id);
				const pin = params.pin ?? '-1';
				const mode = params.mode ?? 'CHANGE';
				const fn = `isr_${id}`;
				const body = captureCode('out', 1);
				registerFunction(
					`void ${fn}()`,
					body,
					`void ${fn}();`
				);
				return {
					parts: [
						[`${pad}attachInterrupt(digitalPinToInterrupt(${pin}), ${fn}, ${mode});`]
					]
				};
			}
		},
		{
			id: 'task',
			trigger: true,
			name: 'Task',
			color: '#22c55e',
			icon: '💼',
			category: 'trigger',
			description: 'สร้าง FreeRTOS Task ที่รันอยู่เบื้องหลังพร้อมกำหนด Stack size และ Priority',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void', description: 'สายลำดับการทำงานภายใน Task' }],
			params: [
				{ id: 'stack', label: 'Stack', type: 'number', default: '8192', description: 'จำนวนพื้นที่หน่วยความจำที่อนุญาตให้ใช้ทำงาน' },
				{ id: 'priority', label: 'Priority', type: 'number', default: '5', description: 'ลำดับความสำคัญของงาน (ตัวเลขยิ่งมาก ยิ่งสำคัญ)' },
			],
			toCode({ block, safeId, captureCode, registerFunction, pad, params }) {
				const id = safeId(block.id);
				const fn = `task_${id}`;
				const body = captureCode('out', 1);
				const stack = params.stack ?? '8192';
				const priority = params.stack ?? '8192';
				registerFunction(
					`void ${fn}(void* pvParameters)`,
					body + '\n' +
					'\n' + 
					pad + 'vTaskDelete(NULL);',
					`void ${fn}(void* pvParameters);`
				);
				return {
					parts: [
						[`${pad}xTaskCreate(${fn}, "${fn}", ${stack}, NULL, ${priority}, NULL);`]
					]
				};
			}
		},
	]
};
