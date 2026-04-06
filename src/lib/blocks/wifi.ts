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
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'ssid',     type: 'text', label: 'SSID',     default: 'MyWiFi',   description: 'ชื่อเครือข่าย WiFi' },
				{ id: 'password', type: 'text', label: 'Password', default: 'mypassword', description: 'รหัสผ่าน WiFi' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const ssid     = (params.ssid     ?? 'MyWiFi').replaceAll('"', '\\"');
				const password = (params.password ?? '').replaceAll('"', '\\"');
				return {
					parts: [
						[`${pad}WiFi.begin("${ssid}", "${password}");`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'wifi_wait_connected',
			name: 'WiFi Wait Connected',
			color: '#06b6d4',
			icon: '⏳',
			category: 'wifi',
			description: 'รอจนกว่า WiFi จะเชื่อมต่อสำเร็จ (blocking loop พร้อม delay)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไปหลังเชื่อมต่อสำเร็จ' }],
			params: [
				{ id: 'delay_ms', type: 'number', label: 'Delay (ms)', default: '500', description: 'หน่วงเวลาระหว่างการตรวจสอบ' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const d = params.delay_ms ?? '500';
				return {
					parts: [
						[`${pad}while (WiFi.status() != WL_CONNECTED) { delay(${d}); }`],
						{ portId: 'out', depthDelta: 0 }
					]
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
			outputs: [{ id: 'connected', type: 'output', label: 'Connected', dataType: 'bool', description: 'true ถ้าเชื่อมต่อ WiFi อยู่' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}bool ${id} = (WiFi.status() == WL_CONNECTED);`],
						{ portId: 'connected', depthDelta: 0 }
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
						{ label: 'AP + Station',      value: 'WIFI_AP_STA' },
						{ label: 'Off',               value: 'WIFI_OFF' },
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
	]
};
