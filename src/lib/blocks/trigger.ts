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
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Next', dataType: 'void' }],
			toCode({ block, safeId, captureCode, registerFunction, pad }) {
				const id = safeId(block.id);
				const fn = `task_${id}`;
				const body = captureCode('out', 1);
				registerFunction(
					`void ${fn}(void* pvParameters)`,
					body + '\n\n' + pad + 'vTaskDelete(NULL);',
					`void ${fn}(void* pvParameters);`
				);
				return {
					parts: [
						[`${pad}xTaskCreate(${fn}, "${fn}", 8192, NULL, 5, NULL);`]
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
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: 'Task', dataType: 'void' }],
			params: [
				/*{
					id: 'interval',
					type: 'number',
					default: '1000',
					validation: (n) => Math.max(1, Math.trunc(n))
				}*/
				{
					id: 'interval',
					type: 'option',
					options: [
						{ label: "every 1 second", value: "1 * 1000" },
						{ label: "every 5 seconds", value: "5 * 1000" },
						{ label: "every 10 seconds", value: "10 * 1000" },
						{ label: "every 30 seconds", value: "30 * 1000" },
						{ label: "every 1 mins", value: "60 * 1000" },
						{ label: "every 2 mins", value: "2 * 60 * 1000" },
						{ label: "every 5 mins", value: "5 * 60 * 1000" },
						{ label: "every 10 mins", value: "10 * 60 * 1000" },
						{ label: "every 30 mins", value: "30 * 60 * 1000" },
						{ label: "every 1 hours", value: "60 * 60 * 1000" },
					]
				}
			],
			toCode({ block, params, safeId, captureCode, registerFunction, pad }) {
				const id = safeId(block.id);
				const fn = `task_${id}`;
				const interval = params.interval ?? '1000';
				const body = captureCode('out', 1);
				const taskBody = [
					`    for (;;) {`,
					body.split('\n').map(l => `    ${l}`).join('\n'),
					`        vTaskDelay((${interval}) / portTICK_PERIOD_MS);`,
					`    }`
				].join('\n');
				registerFunction(
					`void ${fn}(void* pvParameters)`,
					taskBody,
					`void ${fn}(void* pvParameters);`
				);
				return {
					parts: [
						[`${pad}xTaskCreate(${fn}, "${fn}", 8192, NULL, 5, NULL);`]
					]
				};
			}
		}
	]
};
