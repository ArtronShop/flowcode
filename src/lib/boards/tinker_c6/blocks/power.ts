import type { BlockCategory } from '$lib/blocks/types.js';

const COLOR = '#0891b2'; // cyan-dark

export const powerCategory: BlockCategory = {
    name: 'Power Management',
    blocks: [
        {
			id: 'power_12v_control',
			name: '12V Power Control',
			color: COLOR,
			icon: '🔌',
			category: 'power',
			description: 'เปิด/ปิดแรงดันเอาต์พุต 12V',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' },],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'state', type: 'option', label: 'State',
					options: [
						{ label: 'Enable (ON)', value: 'enable12V' },
						{ label: 'Disable (OFF)', value: 'disable12V' },
					],
				},
			],
			toCode({ pad, params, registerPreprocessor, resolveInput }) {
				const state = params.state ?? 'disable12V';

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}TinkerC6.Power.${state}();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

        // ─── Light Sleep ─────────────────────────────────────────────────────
		{
			id: 'light_sleep',
			name: 'Light Sleep',
			color: COLOR,
			icon: '💤',
			category: 'power',
			description: 'เข้าโหมด Light Sleep ตามเวลาที่กำหนด\nหลังตื่น ESP32 ทำงานต่อจากจุดเดิม (ไม่ reset)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'duration', type: 'input', label: 'Duration', dataType: 'long', description: 'ระยะเวลา sleep (ms)' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'duration', type: 'number', label: 'Duration (ms)', default: '5000',
					validation: (n: number) => Math.max(0, n),
				},
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				const dur = resolveInput('duration') ?? params.duration ?? '5000';

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}TinkerC6.Power.enterToLightSleep(${dur});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

        // ─── Deep Sleep ──────────────────────────────────────────────────────
		{
			id: 'deep_sleep_timer',
			name: 'Deep Sleep',
			color: COLOR,
			icon: '😴',
			category: 'power',
			description: 'เข้าโหมด Deep Sleep แล้วตื่นขึ้นอัตโนมัติตามเวลาที่กำหนด\nหลังตื่น ESP32 จะ restart ใหม่ตั้งแต่ต้น',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'duration', type: 'input', label: 'Duration', dataType: 'long', description: 'ระยะเวลา sleep ตามหน่วยที่เลือก' },
			],
			outputs: [
				// { id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'โค้ดหลังนี้จะไม่ถูกเรียก (ESP32 reset แล้ว)' }
			],
			params: [
				{
					id: 'duration', type: 'number', label: 'Duration', default: '10',
					description: 'ระยะเวลา fallback',
					validation: (n: number) => Math.max(0, n),
				},
				{
					id: 'unit', type: 'option', label: 'Unit',
					options: [
						{ label: 'Seconds (s)', value: 's' },
						{ label: 'Millisecond (ms)', value: 'ms' },
						{ label: 'Minute', value: 'min' },
					],
					default: 's',
				},
			],
			toCode({ pad, params, registerPreprocessor, resolveInput }) {
				const dur = resolveInput('duration') ?? params.duration ?? '10';
				const unit = params.unit ?? 's';
				const multiplierMap: Record<string, string> = {
					s: '1000ULL',
					ms: '1ULL',
					min: '60000ULL',
				};
				const mult = multiplierMap[unit] ?? '1000000ULL';

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}TinkerC6.Power.enterToDeepSleep((uint64_t)(${dur}) * ${mult});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

        {
			id: 'get_batt_soc',
			name: 'Get Battery SOC (%) ',
			color: COLOR,
			icon: '🔋',
			category: 'power',
			description: 'อ่าน % แบตเตอรี่',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: 'SOC', dataType: 'int' }],
			toCode({ pad, block, safeId, resolveInput, registerPreprocessor }) {
                const id = safeId(block.id);

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}int ${id} = TinkerC6.Power.getSOC();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
        {
			id: 'get_batt_volt',
			name: 'Get Battery Voltage (V)',
			color: COLOR,
			icon: '🔋',
			category: 'power',
			description: 'อ่านแรงดันแบตเตอรี่',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: 'V', dataType: 'int' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
                const id = safeId(block.id);

                registerPreprocessor('#include <TinkerC6.h>');

				return {
					parts: [
						[`${pad}float ${id} = TinkerC6.Power.getBatteryVoltage();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
    ]
};
