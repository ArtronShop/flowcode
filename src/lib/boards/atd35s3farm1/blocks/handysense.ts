import type { BlockCategory } from '../../../blocks/types.js';

const COLOR_UI = '#dc2626'; // red

export const handysenseCategory: BlockCategory = {
	name: 'HandySense & UI',
	blocks: [
		// ─── Begin ───────────────────────────────────────────────────────────
		{
			id: 'handysense_begin',
			name: 'HandySense & UI Begin',
			color: COLOR_UI,
			icon: '⛳',
			category: 'handysense',
			description: 'เริ่มต้น HandySense & UI',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, registerPreprocessor, registerPollingCode }) {
				registerPreprocessor('#include <Arduino.h>');
				registerPreprocessor('#include <HandySense.h>');
				registerPreprocessor('#include <UI.h>');

				registerPollingCode('HandySense_loop();');
				registerPollingCode('UI_loop();');

				return {
					parts: [
						[`${pad}Serial.begin(115200);`],
						[`${pad}HandySense_init(); // Init HandySense, MQTT, WiFi Manager`],
						[`${pad}UI_init(); // Init LVGL and UI`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		{
			id: 'on_sensor_request',
			trigger: true,
			name: 'On Sensor Request',
			color: COLOR_UI,
			icon: '📊',
			category: 'handysense',
			description: 'เมื่อมีการร้องขอค่าจากเซ็นเซอร์',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [{ id: 'type', type: 'option', label: 'Type', options: [
				{ label: 'Temperature (°C)', value: 'Temp' },
				{ label: 'Humidity (%RH)', value: 'Humi' },
				{ label: 'Soil moisture (%)', value: 'Soil' },
				{ label: 'Light (lux)', value: 'Light' },
			]}],
			toCode({ params, registerFunction, captureCode }) {
				const type = params.type ?? 'Temp';
				const body = captureCode('out', 1);

				registerFunction(`bool Sensor_get${type}(float * value)`, [
					'  bool _ok = false;',
					body,
					'  return _ok;',
				].join('\n'));

				return {
					parts: [

					]
				};
			},
			requires: [ 'handysense_begin' ],
		},
		{
			id: 'sensor_value_response',
			name: 'Sensor Value Response',
			color: COLOR_UI,
			icon: '✅',
			category: 'handysense',
			description: 'ตอบกลับค่าเซ็นเซอร์ไปยัง HandySense\nใช้ภายใน On Sensor Request เท่านั้น',
			inputs: [{ id: 'value', type: 'input', label: 'Value', dataType: 'float' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const value = resolveInput('value') ?? '0';

				return {
					parts: [
						[`${pad}*value = ${value};`],
						[`${pad}_ok = true;`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			},
			requires: [ 'handysense_begin' ],
		},
		{
			id: 'sensor_error_response',
			name: 'Sensor Error Response',
			color: COLOR_UI,
			icon: '⚠️',
			category: 'handysense',
			description: 'แจ้งว่าอ่านค่าเซ็นเซอร์ไม่สำเร็จ\nใช้ภายใน On Sensor Request เท่านั้น',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad }) {
				return {
					parts: [
						[`${pad}_ok = false;`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			},
			requires: [ 'handysense_begin' ],
		},
	]
};
