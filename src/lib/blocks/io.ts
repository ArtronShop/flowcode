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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'mode',
					type: 'option',
					label: 'Mode',
					options: [
						{ label: 'INPUT', value: 'INPUT' },
						{ label: 'OUTPUT', value: 'OUTPUT' },
						{ label: 'INPUT_PULLUP', value: 'INPUT_PULLUP' }
					]
				}
			],
			toCode({ pad, params }) {
				const pin = params.pin ?? '5';
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '2'
				}
			],
			toCode({ block, pad, safeId, params }) {
				const id = safeId(block.id);
				let pin = params.pin ?? '2';
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'value',
					type: 'option',
					label: 'Value',
					options: [
						{ label: 'LOW', value: 'LOW' },
						{ label: 'HIGH', value: 'HIGH' },
					]
				}
			],
			toCode({ pad, resolveInput, params }) {
				const pin = params.pin ?? '5';
				const val = params.value ?? 'LOW';
				return {
					parts: [
						[`${pad}digitalWrite(${pin}, ${val});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'digital_write2',
			name: 'Digital Write 2',
			color: '#3b82f6',
			icon: '✍️',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int' }
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const pin = resolveInput('pin') ?? '-1';
				const val = resolveInput('value') ?? '0';
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '2'
				}
			],
			toCode({ pad, params }) {
				let pin = params.pin ?? '5';
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
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
			],
			toCode({ block, pad, safeId, params }) {
				const id = safeId(block.id);
				const pin = params.pin ?? '5';
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '5'
				},
				{
					id: 'value',
					type: 'number',
					label: 'Value (0-255)',
					validation: (n: number) => n < 0 ? 0 : n > 255 ? 255 : n,
				}
			],
			toCode({ pad, resolveInput, params }) {
				const pin = params.pin ?? '5';
				const val = params.value ?? 'LOW';
				return {
					parts: [
						[`${pad}digitalWrite(${pin}, ${val});`],
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
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
			],
			outputs: [{ id: 'time', type: 'output', label: 'Time (uS)', dataType: 'long' }],
			params: [
				{
					id: 'pin',
					type: 'number',
					label: 'Pin',
					default: '2'
				},
				{
					id: 'value',
					type: 'option',
					label: 'Value',
					options: [
						{ label: "HIGH", value: "HIGH" },
						{ label: "LOW", value: "LOW" },
					]
				},
				{
					id: 'timeout',
					type: 'number',
					label: 'Timeout (uS)',
					default: '1000000'
				}
			],
			toCode({ pad, block, safeId, params }) {
				const id = safeId(block.id);
				const pin = params.pin ?? '5';
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
