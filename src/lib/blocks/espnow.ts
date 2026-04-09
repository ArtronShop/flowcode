import type { BlockCategory } from './types.js';

export const espnowCategory: BlockCategory = {
	name: 'ESP-NOW',
	blocks: [
		// ─── Init ─────────────────────────────────────────────────────────
		{
			id: 'espnow_init',
			name: 'ESP-NOW Init',
			color: '#f59e0b',
			icon: '📡',
			category: 'espnow',
			description: 'เริ่มต้น ESP-NOW และตั้ง WiFi mode เป็น STA (WiFi.mode + esp_now_init)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'ok',    type: 'output', label: 'OK',    dataType: 'void', description: 'ถ้า init สำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'ถ้า init ไม่สำเร็จ' },
				{ id: 'out',   type: 'output', label: '➜',     dataType: 'void', description: 'ส่งต่อเสมอหลัง if/else' },
			],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				registerPreprocessor('#include <esp_now.h>');
				return {
					parts: [
						[`${pad}WiFi.mode(WIFI_STA);`, `${pad}if (esp_now_init() == ESP_OK) {`],
						{ portId: 'ok',    depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'out',   depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_deinit',
			name: 'ESP-NOW Deinit',
			color: '#f59e0b',
			icon: '🔴',
			category: 'espnow',
			description: 'ปิดการใช้งาน ESP-NOW และคืน resource (esp_now_deinit)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <esp_now.h>');
				return {
					parts: [
						[`${pad}esp_now_deinit();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Peer management ──────────────────────────────────────────────
		{
			id: 'espnow_add_peer',
			name: 'ESP-NOW Add Peer',
			color: '#f59e0b',
			icon: '➕',
			category: 'espnow',
			description: 'เพิ่ม peer device โดยระบุ MAC address 6 byte คั่นด้วย : เช่น AA:BB:CC:DD:EE:FF',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'ok',    type: 'output', label: 'OK',    dataType: 'void', description: 'ถ้าเพิ่ม peer สำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'ถ้าเพิ่ม peer ไม่สำเร็จ' },
				{ id: 'out',   type: 'output', label: '➜',     dataType: 'void', description: 'ส่งต่อเสมอหลัง if/else' },
			],
			params: [
				{ id: 'mac',     type: 'text',   label: 'MAC Address',  default: 'AA:BB:CC:DD:EE:FF', description: 'MAC address ของ peer คั่นด้วย :' },
				{ id: 'channel', type: 'number', label: 'WiFi Channel', default: '0',  description: '0 = ใช้ channel ปัจจุบัน' },
				{
					id: 'encrypt', type: 'option', label: 'Encrypt',
					options: [
						{ label: 'No',  value: 'false' },
						{ label: 'Yes', value: 'true'  },
					],
					description: 'เข้ารหัส LMK หรือไม่'
				},
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <esp_now.h>');
				const id      = safeId(block.id);
				const mac     = params.mac     ?? 'AA:BB:CC:DD:EE:FF';
				const channel = params.channel ?? '0';
				const encrypt = params.encrypt ?? 'false';
				const bytes  = mac.split(':').map((b) => `0x${b.toUpperCase().padStart(2, '0')}`);
				const macArr = bytes.length === 6 ? bytes.join(', ') : '0x00, 0x00, 0x00, 0x00, 0x00, 0x00';
				return {
					parts: [
						[
							`${pad}esp_now_peer_info_t _peer_${id} = {};`,
							`${pad}uint8_t _mac_${id}[] = {${macArr}};`,
							`${pad}memcpy(_peer_${id}.peer_addr, _mac_${id}, 6);`,
							`${pad}_peer_${id}.channel = ${channel};`,
							`${pad}_peer_${id}.encrypt = ${encrypt};`,
							`${pad}if (esp_now_add_peer(&_peer_${id}) == ESP_OK) {`,
						],
						{ portId: 'ok',    depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'out',   depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_del_peer',
			name: 'ESP-NOW Del Peer',
			color: '#f59e0b',
			icon: '➖',
			category: 'espnow',
			description: 'ลบ peer device ออกจากรายการ (esp_now_del_peer)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'mac', type: 'text', label: 'MAC Address', default: 'AA:BB:CC:DD:EE:FF' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <esp_now.h>');
				const id  = safeId(block.id);
				const mac = params.mac ?? 'AA:BB:CC:DD:EE:FF';
				const bytes  = mac.split(':').map((b) => `0x${b.toUpperCase().padStart(2, '0')}`);
				const macArr = bytes.length === 6 ? bytes.join(', ') : '0x00, 0x00, 0x00, 0x00, 0x00, 0x00';
				return {
					parts: [
						[
							`${pad}{ uint8_t _mac_${id}[] = {${macArr}};`,
							`${pad}  esp_now_del_peer(_mac_${id}); }`,
						],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Send ─────────────────────────────────────────────────────────
		{
			id: 'espnow_send_bytes',
			name: 'ESP-NOW Send Bytes',
			color: '#f59e0b',
			icon: '📤',
			category: 'espnow',
			description: 'ส่งข้อมูล HEX bytes ไปยัง peer ที่กำหนด (esp_now_send)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [
				{ id: 'ok',    type: 'output', label: 'OK',    dataType: 'void', description: 'ถ้าส่งสำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'ถ้าส่งไม่สำเร็จ' },
				{ id: 'out',   type: 'output', label: '➜',     dataType: 'void', description: 'ส่งต่อเสมอหลัง if/else' },
			],
			params: [
				{ id: 'mac',   type: 'text', label: 'Peer MAC',          default: 'AA:BB:CC:DD:EE:FF', description: 'MAC ปลายทาง หรือ FF:FF:FF:FF:FF:FF เพื่อ broadcast' },
				{ id: 'bytes', type: 'text', label: 'Bytes (HEX, space-separated)', default: '01 02 03', description: 'ค่า HEX แต่ละ byte คั่นด้วยช่องว่าง' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <esp_now.h>');
				const id      = safeId(block.id);
				const mac     = params.mac ?? 'AA:BB:CC:DD:EE:FF';
				const raw     = (params.bytes ?? '01').trim();
				const macBytes = mac.split(':').map((b) => `0x${b.toUpperCase().padStart(2, '0')}`);
				const macArr   = macBytes.length === 6 ? macBytes.join(', ') : '0x00,0x00,0x00,0x00,0x00,0x00';
				const tokens   = raw.split(/\s+/).filter((t) => /^[0-9a-fA-F]{1,2}$/.test(t));
				const dataArr  = tokens.map((t) => `0x${t.toUpperCase().padStart(2, '0')}`).join(', ');
				const len      = tokens.length || 1;
				return {
					parts: [
						[
							`${pad}uint8_t _mac_${id}[] = {${macArr}};`,
							`${pad}uint8_t _data_${id}[${len}] = {${dataArr}};`,
							`${pad}if (esp_now_send(_mac_${id}, _data_${id}, ${len}) == ESP_OK) {`,
						],
						{ portId: 'ok',    depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'out',   depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_send_string',
			name: 'ESP-NOW Send String',
			color: '#f59e0b',
			icon: '💬',
			category: 'espnow',
			description: 'ส่งข้อมูล String ไปยัง peer (esp_now_send) — แปลง String เป็น byte array ให้อัตโนมัติ',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',    dataType: 'any',    description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data',  dataType: 'String', description: 'ข้อมูล String ที่ต้องการส่ง' },
			],
			outputs: [
				{ id: 'ok',    type: 'output', label: 'OK',    dataType: 'void', description: 'ถ้าส่งสำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'ถ้าส่งไม่สำเร็จ' },
				{ id: 'out',   type: 'output', label: '➜',     dataType: 'void', description: 'ส่งต่อเสมอหลัง if/else' },
			],
			params: [
				{ id: 'mac',  type: 'text', label: 'Peer MAC', default: 'AA:BB:CC:DD:EE:FF' },
				{ id: 'data', type: 'text', label: 'Data',     default: 'hello', description: 'ใช้เมื่อไม่มีบล็อกต่อเข้ามา' },
			],
			toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <esp_now.h>');
				const id       = safeId(block.id);
				const mac      = params.mac ?? 'AA:BB:CC:DD:EE:FF';
				const macBytes = mac.split(':').map((b) => `0x${b.toUpperCase().padStart(2, '0')}`);
				const macArr   = macBytes.length === 6 ? macBytes.join(', ') : '0x00,0x00,0x00,0x00,0x00,0x00';
				const data     = resolveInput('data') ?? `String("${(params.data ?? 'hello').replaceAll('"', '\\"')}")`;
				return {
					parts: [
						[
							`${pad}uint8_t _mac_${id}[] = {${macArr}};`,
							`${pad}String _str_${id} = ${data};`,
							`${pad}if (esp_now_send(_mac_${id}, (uint8_t*)_str_${id}.c_str(), _str_${id}.length()) == ESP_OK) {`,
						],
						{ portId: 'ok',    depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'out',   depthDelta: 0 },
					]
				};
			}
		},

		// ─── Callbacks ────────────────────────────────────────────────────
		{
			id: 'espnow_on_recv',
			name: 'ESP-NOW On Receive',
			color: '#f59e0b',
			icon: '📥',
			trigger: true,
			category: 'espnow',
			description: 'ลงทะเบียน callback ที่เรียกเมื่อรับข้อมูลจาก peer (esp_now_register_recv_cb)\nภายใน handler: ตัวแปร _espnow_mac (uint8_t*), _espnow_data (uint8_t*), _espnow_len (int)',
			inputs: [],
			outputs: [
				{ id: 'handler', type: 'output', label: '➜', dataType: 'any', description: 'โค้ดที่รันเมื่อรับข้อมูล' },
			],
			toCode({ pad, block, safeId, captureCode, registerPreprocessor, registerFunction }) {
				registerPreprocessor('#include <esp_now.h>');
				const id     = safeId(block.id);
				const fnName = `_espnow_recv_cb_${id}`;
				const body   = captureCode('handler', 1);
				registerFunction(
					`void ${fnName}(const esp_now_recv_info_t* info, const uint8_t* _espnow_data, int _espnow_len)`,
					[
						`  const uint8_t* _espnow_mac = info->src_addr;`,
						body,
					].filter(Boolean).join('\n'),
					`void ${fnName}(const esp_now_recv_info_t*, const uint8_t*, int);`
				);
				return {
					parts: [
						[`${pad}esp_now_register_recv_cb(${fnName});`],
					]
				};
			}
		},
		{
			id: 'espnow_on_send',
			name: 'ESP-NOW On Send',
			color: '#f59e0b',
			icon: '✅',
			trigger: true,
			category: 'espnow',
			description: 'ลงทะเบียน callback ที่เรียกหลังส่งข้อมูลเสร็จ (esp_now_register_send_cb)\nภายใน handler: _espnow_mac (uint8_t*), _espnow_status (esp_now_send_status_t)',
			inputs: [],
			outputs: [
				{ id: 'handler', type: 'output', label: '➜', dataType: 'any', description: 'โค้ดที่รันหลังส่งข้อมูล' },
			],
			toCode({ pad, block, safeId, captureCode, registerPreprocessor, registerFunction }) {
				registerPreprocessor('#include <esp_now.h>');
				const id     = safeId(block.id);
				const fnName = `_espnow_send_cb_${id}`;
				const body   = captureCode('handler', 1);
				registerFunction(
					`void ${fnName}(const uint8_t* _espnow_mac, esp_now_send_status_t _espnow_status)`,
					body,
					`void ${fnName}(const uint8_t*, esp_now_send_status_t);`
				);
				return {
					parts: [
						[`${pad}esp_now_register_send_cb(${fnName});`],
					]
				};
			}
		},

		// ─── Helper ───────────────────────────────────────────────────────
		{
			id: 'espnow_recv_data_string',
			name: 'ESP-NOW Recv Data as String',
			color: '#f59e0b',
			icon: '🔤',
			category: 'espnow',
			description: 'แปลงข้อมูลที่รับได้ (_espnow_data, _espnow_len) เป็น String — ใช้ภายใน On Receive handler',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'value', type: 'output', label: 'Data', dataType: 'String' }],
			toCode({ pad, block, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = String((char*)_espnow_data).substring(0, _espnow_len);`],
						{ portId: 'value', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_recv_mac_string',
			name: 'ESP-NOW Recv MAC as String',
			color: '#f59e0b',
			icon: '🆔',
			category: 'espnow',
			description: 'แปลง MAC address ผู้ส่ง (_espnow_mac) เป็น String รูปแบบ AA:BB:CC:DD:EE:FF — ใช้ภายใน On Receive handler',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'mac', type: 'output', label: 'MAC', dataType: 'String' }],
			toCode({ pad, block, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[
							`${pad}char _macbuf_${id}[18];`,
							`${pad}snprintf(_macbuf_${id}, sizeof(_macbuf_${id}), "%02X:%02X:%02X:%02X:%02X:%02X",`,
							`${pad}  _espnow_mac[0], _espnow_mac[1], _espnow_mac[2],`,
							`${pad}  _espnow_mac[3], _espnow_mac[4], _espnow_mac[5]);`,
							`${pad}String ${id} = String(_macbuf_${id});`,
						],
						{ portId: 'mac', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_send_ok',
			name: 'ESP-NOW Send Status OK',
			color: '#f59e0b',
			icon: '📊',
			category: 'espnow',
			description: 'ตรวจสอบว่าการส่งครั้งล่าสุดสำเร็จหรือไม่ — ใช้ภายใน On Send handler',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'ok', type: 'output', label: 'OK', dataType: 'bool' }],
			toCode({ pad, block, safeId }) {
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}bool ${id} = (_espnow_status == ESP_NOW_SEND_SUCCESS);`],
						{ portId: 'ok', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'espnow_get_mac',
			name: 'ESP-NOW Get Own MAC',
			color: '#f59e0b',
			icon: '📱',
			category: 'espnow',
			description: 'อ่าน MAC address ของอุปกรณ์ตัวเอง (WiFi.macAddress) เพื่อแจ้งให้ peer อื่นทราบ',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'mac', type: 'output', label: 'MAC', dataType: 'String' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <WiFi.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = WiFi.macAddress();`],
						{ portId: 'mac', depthDelta: 0 },
					]
				};
			}
		},
	]
};
