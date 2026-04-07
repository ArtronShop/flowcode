import type { BlockCategory } from './types.js';

export const wifiCategory: BlockCategory = {
	name: 'WiFi',
	blocks: [
		{
			id: 'wifi_begin',
			name: 'WiFi Begin',
			color: '#06b6d4',
			icon: '📶',
			category: 'wifi',
			description: 'เชื่อมต่อ WiFi โดยใช้ SSID และ Password (WiFi.begin)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'ok', type: 'output', label: 'OK', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'เชื่อมต่อ WiFi ไม่สำเร็จ (หมดเวลารอ)' }
			],
			params: [
				{ id: 'ssid', type: 'text', label: 'SSID', default: 'MyWiFi', description: 'ชื่อเครือข่าย WiFi' },
				{ id: 'password', type: 'text', label: 'Password', default: 'mypassword', description: 'รหัสผ่าน WiFi' },
				{ id: 'wait_connected', type: 'option', label: 'Wait Connected', options: [
					{ label: 'Yes', value: 'Y' },
					{ label: 'No', value: 'N' },
				]},
				{ id: 'timeout_ms', type: 'number', label: 'Max wait time (ms)', default: '30000', validation: (n: number) => Math.max(100, n), description: 'ระยะเวลารอเชื่อมต่อนานสุด', hidden: ({ params }) => params.wait_connected === 'N' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const ssid = (params.ssid ?? 'MyWiFi').replaceAll('"', '\\"');
				const password = (params.password ?? '').replaceAll('"', '\\"');
				const wait_connected = params.wait_connected === 'Y';
				const timeout = params.timeout_ms ?? '30000';

				const allStatement: any[] = [];
				allStatement.push([`${pad}WiFi.begin("${ssid}", "${password}");`]);
				if (wait_connected) {
					allStatement.push([`${pad}{ // wait WiFi connect with timeout ${timeout} ms`]);
					allStatement.push([`${pad}  uint32_t timeout = ${timeout};`]);
					allStatement.push([`${pad}  while((WiFi.status() != WL_CONNECTED) && (timeout > 0)) {`]);
					allStatement.push([`${pad}    delay(100);`]);
					allStatement.push([`${pad}    timeout -= 100;`]);
					allStatement.push([`${pad}  }`]);
					allStatement.push([`${pad}}`]);
				}
				if (wait_connected) {
					allStatement.push([`${pad}if (WiFi.status() == WL_CONNECTED) {`]);
					allStatement.push({ portId: 'ok', depthDelta: 1 });
					allStatement.push([`${pad}} else {`]);
					allStatement.push({ portId: 'error', depthDelta: 1 });
					allStatement.push([`${pad}}`]);
				} else {
					allStatement.push({ portId: 'ok', depthDelta: 0 });
				}
				return {
					parts: allStatement
				};
			}
		},
		{
			id: 'wifi_is_connected',
			name: 'WiFi Is Connected',
			color: '#06b6d4',
			icon: '✅',
			category: 'wifi',
			description: 'ตรวจสอบสถานะการเชื่อมต่อ WiFi ปัจจุบัน',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'connected', type: 'output', label: 'Connected', dataType: 'void', description: 'ถ้าเชื่อมต่อ WiFi อยู่' },
				{ id: 'disconnect', type: 'output', label: 'Disconnect', dataType: 'void', description: 'ถ้าหยุดเชื่อมต่อ WiFi แล้ว' }
			],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}if (WiFi.status() == WL_CONNECTED) {`],
						{ portId: 'connected', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'disconnect', depthDelta: 1 },
						[`${pad}}`]
					]
				};
			}
		},
		{
			id: 'wifi_local_ip',
			name: 'WiFi Local IP',
			color: '#06b6d4',
			icon: '🌐',
			category: 'wifi',
			description: 'รับ IP address ของอุปกรณ์ในรูป String (WiFi.localIP)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'ip', type: 'output', label: 'IP', dataType: 'String', description: 'IP address เช่น "192.168.1.10"' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = WiFi.localIP().toString();`],
						{ portId: 'ip', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'wifi_rssi',
			name: 'WiFi RSSI',
			color: '#06b6d4',
			icon: '📡',
			category: 'wifi',
			description: 'วัดความแรงสัญญาณ WiFi (dBm) ยิ่งค่าน้อยยิ่งสัญญาณอ่อน',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'rssi', type: 'output', label: 'RSSI', dataType: 'int', description: 'ค่า RSSI (dBm)' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = WiFi.RSSI();`],
						{ portId: 'rssi', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'wifi_disconnect',
			name: 'WiFi Disconnect',
			color: '#06b6d4',
			icon: '🔌',
			category: 'wifi',
			description: 'ตัดการเชื่อมต่อ WiFi (WiFi.disconnect)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				return {
					parts: [
						[`${pad}WiFi.disconnect();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'wifi_set_mode',
			name: 'WiFi Set Mode',
			color: '#06b6d4',
			icon: '⚙️',
			category: 'wifi',
			description: 'กำหนดโหมด WiFi (Station / AP / AP+Station)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{
					id: 'mode', type: 'option', label: 'Mode',
					options: [
						{ label: 'Station (STA)', value: 'WIFI_STA' },
						{ label: 'Access Point (AP)', value: 'WIFI_AP' },
						{ label: 'AP + Station', value: 'WIFI_AP_STA' },
						{ label: 'Off', value: 'WIFI_OFF' },
					],
					description: 'โหมด WiFi'
				},
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const mode = params.mode ?? 'WIFI_STA';
				return {
					parts: [
						[`${pad}WiFi.mode(${mode});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'wifi_event',
			name: 'WiFi Event',
			trigger: true,
			color: '#06b6d4',
			icon: '📶',
			category: 'wifi',
			description: 'กำหนดบล็อกที่ต้องการให้ทำงานเมื่อเกิดเหตุการณ์เกี่ยวกับ WiFi',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'บล็อกที่ต้องการให้ทำงานเมื่อเกิดเหตุการณ์' }],
			params: [
				{
					id: 'event', type: 'option', label: 'Event',
					options: [
						{ label: 'WiFi STA Start', value: 'ARDUINO_EVENT_WIFI_STA_START' },
						{ label: 'WiFi STA Connected', value: 'ARDUINO_EVENT_WIFI_STA_CONNECTED' },
						{ label: 'WiFi STA Got IP', value: 'ARDUINO_EVENT_WIFI_STA_GOT_IP' },
						{ label: 'WiFi STA Disconnect', value: 'ARDUINO_EVENT_WIFI_STA_DISCONNECTED ' },
						{ label: 'WiFi STA Lost IP', value: 'ARDUINO_EVENT_WIFI_STA_LOST_IP' },

					],
					description: 'เหตุการณ์ที่ต้องการตรวจจับ'
				},
			],
			toCode({ block, safeId, captureCode, pad, params, registerPreprocessor, registerFunction }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				const fn = `wifi_event_${id}`;
				const body = captureCode('out', 1);
				const event = params.event ?? 'ARDUINO_EVENT_WIFI_STA_START';
				registerFunction(
					`void ${fn}(WiFiEvent_t event, WiFiEventInfo_t info)`,
					body,
					`void ${fn}(WiFiEvent_t event, WiFiEventInfo_t info);`
				);
				return {
					parts: [
						[`${pad}WiFi.onEvent(${fn}, WiFiEvent_t::${event});`]
					]
				};
			}
		},
	]
};
