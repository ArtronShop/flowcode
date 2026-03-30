import type { BlockCategory } from './types.js';

export const ioCategory: BlockCategory = {
	name: 'Input / Output',
	blocks: [
		{
			id: 'pin_mode',
			name: 'Pin Mode',
			color: '#ef4444',
			icon: '■',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: 'Before', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' },
				{ id: 'mode', type: 'input', label: 'Mode', dataType: 'pin_mode' }
			],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const pin = resolveInput('pin') ?? '-1';
				const mode = resolveInput('mode') ?? '0';
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
			color: '#22c55e',
			icon: '▶',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: 'In', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' }
			],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int' }],
			toCode({ block, pad, resolveInput, safeId }) {
				const id = safeId(block.id);
				let pin = resolveInput('pin') ?? '-1';
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
			color: '#ef4444',
			icon: '■',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: 'Before', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int' }
			],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void' }],
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
			color: '#ef4444',
			icon: '■',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: 'Before', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const pin = resolveInput('pin') ?? '-1';
				const val = resolveInput('value') ?? '0';
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
			icon: '⬇',
			category: 'io',
			inputs: [{ id: 'in', type: 'input', label: 'Before', dataType: 'any' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int' }],
			toCode({ block, pad, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = analogRead(A0);`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'analog_write',
			name: 'Analog Write (PWM)',
			color: '#8b5cf6',
			icon: '⬆',
			category: 'io',
			inputs: [
				{ id: 'in', type: 'input', label: 'Before', dataType: 'any' },
				{ id: 'pin', type: 'input', label: 'Pin', dataType: 'int' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int' }
			],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void' }],
			toCode({ pad, resolveInput }) {
				const pin = resolveInput('pin') ?? '-1';
				const val = resolveInput('value') ?? '255';
				return {
					parts: [
						[`${pad}analogWrite(${pin}, ${val});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		}
	]
};
