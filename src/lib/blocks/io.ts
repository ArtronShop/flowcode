import type { BlockCategory } from './types.js';

export const ioCategory: BlockCategory = {
	name: 'Input / Output',
	blocks: [
		{
			id: 'pin_mode',
			name: 'Pin Mode',
			color: '#3b82f6',
			icon: '🏷️',
			category: 'io',
			description: 'กำหนดโหมดการทำงานของขา GPIO เช่น INPUT, OUTPUT หรือ INPUT_PULLUP (pinMode)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการกำหนดโหมดการทำงาน',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'mode',
					description: 'โหมดการทำงานของ GPIO (INPUT / OUTPUT / INPUT_PULLUP)',
					type: 'option',
					label: 'Mode',
					options: [
						{ label: 'INPUT', value: 'INPUT' },
						{ label: 'OUTPUT', value: 'OUTPUT' },
						{ label: 'INPUT_PULLUP', value: 'INPUT_PULLUP' }
					],
					default: 'OUTPUT'
				}
			],
			toCode({ pad, params, resolveInput }) {
				const pin = resolveInput('pin') ?? params.pin ?? '5';
				const mode = params.mode ?? 'INPUT';
				return {
					parts: [
						[`${pad}pinMode(${pin}, ${mode});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'digital_read',
			name: 'Digital Read',
			color: '#3b82f6',
			icon: '🔎',
			category: 'io',
			description: 'อ่านค่าดิจิทัล (0 = LOW, 1 = HIGH) จากขา GPIO ที่กำหนด (digitalRead)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้จากขา GPIO (int: 0 หรือ 1)' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการอ่านค่า',
					type: 'number',
					label: 'Pin',
					default: '2'
				}
			],
			toCode({ block, pad, safeId, params, resolveInput }) {
				const id = safeId(block.id);
				let pin = resolveInput('pin') ?? params.pin ?? '2';
				return {
					parts: [
						[`${pad}int ${id} = digitalRead(${pin});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'digital_write',
			name: 'Digital Write',
			color: '#3b82f6',
			icon: '✍️',
			category: 'io',
			description: 'เขียนค่าดิจิทัล HIGH หรือ LOW ออกขา GPIO ที่กำหนด (digitalWrite)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการเขียนค่า',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'value',
					description: 'ค่าที่ต้องการเขียน (HIGH / LOW)',
					type: 'option',
					label: 'Value',
					options: [
						{ label: 'LOW (0)', value: 'LOW' },
						{ label: 'HIGH (1)', value: 'HIGH' },
					]
				}
			],
			toCode({ pad, resolveInput, params }) {
				const pin = resolveInput('pin') ?? params.pin ?? '5';
				const val = resolveInput('value') ?? params.value ?? 'LOW';
				return {
					parts: [
						[`${pad}digitalWrite(${pin}, ${val});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'digital_trigger',
			name: 'Digital Trigger',
			color: '#3b82f6',
			icon: '🕹️',
			category: 'io',
			description: 'สลับสถานะ HIGH/LOW ของขา GPIO (toggle) — อ่านค่าปัจจุบันแล้วกลับค่า',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },

			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการสลับสถานะ',
					type: 'number',
					label: 'Pin',
					default: '2'
				}
			],
			toCode({ pad, params, resolveInput }) {
				let pin = resolveInput('pin') ?? params.pin ?? '5';
				return {
					parts: [
						[`${pad}digitalWrite(${pin}, !digitalRead(${pin}));`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'analog_read',
			name: 'Analog Read',
			color: '#3b82f6',
			icon: '🌊',
			category: 'io',
			description: 'อ่านค่า Analog จากขา ADC (0–4095 สำหรับ ESP32 หรือ 0–1023 สำหรับ Arduino) (analogRead)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },

			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้จากขา ADC (int)' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการอ่านค่าแอนะล็อก',
					type: 'number',
					label: 'Pin',
					default: '32'
				},
			],
			toCode({ block, pad, safeId, params, resolveInput }) {
				const id = safeId(block.id);
				const pin = resolveInput('pin') ?? params.pin ?? '32';
				return {
					parts: [
						[`${pad}int ${id} = analogRead(${pin});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'analog_write',
			name: 'Analog Write (PWM)',
			color: '#3b82f6',
			icon: '⚡',
			category: 'io',
			description: 'ส่งสัญญาณ PWM ออกขา GPIO ค่า 0–255 (analogWrite)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปยังบล็อกถัดไป' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการส่งสัญญาณ PWM',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'value',
					description: 'ค่า PWM ที่ต้องการส่ง เมื่อ 0 คือ 0% , 255 คือ 100%)',
					type: 'number',
					label: 'Value (0-255)',
					validation: (n: number) => n < 0 ? 0 : n > 255 ? 255 : n,
				}
			],
			toCode({ pad, params, resolveInput }) {
				const pin = resolveInput('pin') ?? params.pin ?? '5';
				const value = resolveInput('value') ?? params.value ?? 'LOW';
				return {
					parts: [
						[`${pad}digitalWrite(${pin}, ${value});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'pulse_in',
			name: 'Pulse In',
			color: '#3b82f6',
			icon: '⏳',
			category: 'io',
			description: 'วัดความกว้างของพัลส์ HIGH หรือ LOW บนขา GPIO (pulseIn) คืนค่าเป็น microseconds',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int', description: 'หมายเลขขา GPIO' },
			],
			outputs: [{ id: 'time', type: 'output', label: 'Time (uS)', dataType: 'long', description: 'ความกว้างของพัลส์ที่วัดได้ (microseconds)' }],
			params: [
				{
					id: 'pin',
					description: 'หมายเลขขา GPIO ที่ต้องการวัคความกว้างพัลส์',
					type: 'number',
					label: 'Pin',
					default: '2'
				},
				{
					id: 'value',
					description: 'ลอจิกที่ต้องการวัด (HIGH / LOW)',
					type: 'option',
					label: 'Value',
					options: [
						{ label: "HIGH", value: "HIGH" },
						{ label: "LOW", value: "LOW" },
					]
				},
				{
					id: 'timeout',
					description: 'ระยะเวลารอสัญญาณนานสุด หน่วย microseconds',
					type: 'number',
					label: 'Timeout (uS)',
					default: '1000000'
				}
			],
			toCode({ pad, block, safeId, params, resolveInput }) {
				const id = safeId(block.id);
				const pin = resolveInput('pin') ?? params.pin ?? '5';
				const val = params.value ?? 'LOW';
				const timeout = params.timeout ?? '1000000';
				return {
					parts: [
						[`${pad}unsigned long ${id} = pulseIn(${pin}, ${val}, ${timeout});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
