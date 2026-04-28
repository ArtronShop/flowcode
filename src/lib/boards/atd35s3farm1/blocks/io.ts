import type { BlockCategory } from '$lib/blocks/types.js';

export const ioCategory: BlockCategory = {
	name: 'Input / Output',
	blocks: [
		{
			id: 'relay_control',
			name: 'Relay Control',
			color: '#3b82f6',
			icon: '✍️',
			category: 'io',
			description: 'สั่งงานรีเลย์ O1 - O4',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้จากขา GPIO (int: 0 หรือ 1)' }],
			params: [
				{ 
					id: 'pin', description: 'หมายเลขขาที่ต้องการอ่านค่า', type: 'option', label: 'Pin', options: [
						{ label: 'O1', value: '0' },
						{ label: 'O2', value: '1' },
						{ label: 'O3', value: '2' },
						{ label: 'O4', value: '3' },
					], default: '0' 
				},
				{
					id: 'value',
					description: 'ค่าที่ต้องการเขียน (HIGH / LOW)',
					type: 'option',
					label: 'Value',
					options: [
						{ label: 'OFF', value: 'off' },
						{ label: 'ON', value: 'on' },
					], 
					default: 'off'
				}
			],
			toCode({ pad, resolveInput, params, registerGlobal }) {
				registerGlobal('extern void ControlRelay_Bymanual(String topic, String message, unsigned int length) ;');

				const pin = params.pin ?? '1';
				const val = resolveInput('value') ?? params.value ?? 'off';
				return {
					parts: [
						[`${pad}ControlRelay_Bymanual("@private/led${pin}", "${val}", 0);`],
						{ portId: 'value', depthDelta: 0 }
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
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้จากขา GPIO (int: 0 หรือ 1)' }],
			params: [
				{ 
					id: 'pin', description: 'หมายเลขขาที่ต้องการอ่านค่า', type: 'option', label: 'Pin', options: [
						{ label: 'D1', value: '42' },
						{ label: 'D2', value: '4' },
						{ label: 'D3', value: '5' },
					], default: 'D1' 
				}
			],
			toCode({ block, pad, safeId, params, resolveInput }) {
				const id = safeId(block.id);
				const pin = params.pin ?? '42';
				return {
					parts: [
						[`${pad}int ${id} = digitalRead(${pin});`],
						{ portId: 'value', depthDelta: 0 }
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
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้จากขา ADC (int)' }],
			params: [
				{ 
					id: 'pin', description: 'หมายเลขขาที่ต้องการอ่านค่า', type: 'option', label: 'Pin', options: [
						{ label: 'A1', value: '1' },
						{ label: 'A2', value: '2' },
					], default: 'A1' 
				}
			],
			toCode({ block, pad, safeId, params, resolveInput }) {
				const id = safeId(block.id);
				const pin = params.pin ?? '1';
				return {
					parts: [
						[`${pad}int ${id} = analogRead(${pin});`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
	]
};
