import type { BlockCategory } from './types.js';

export const i2cCategory: BlockCategory = {
	name: 'I2C',
	blocks: [
		{
			id: 'i2c_begin',
			name: 'I2C Begin',
			color: '#0ea5e9',
			icon: '🔗',
			category: 'i2c',
			description: 'เริ่มต้น I2C bus (Wire.begin) กำหนดขา SDA และ SCL',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'sda', type: 'number', label: 'SDA Pin', default: '21', description: 'ขา SDA' },
				{ id: 'scl', type: 'number', label: 'SCL Pin', default: '22', description: 'ขา SCL' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const sda = params.sda ?? '21';
				const scl = params.scl ?? '22';
				return {
					parts: [
						[`${pad}Wire.begin(${sda}, ${scl});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_begin_transmission',
			name: 'I2C Begin Transmission',
			color: '#0ea5e9',
			icon: '📤',
			category: 'i2c',
			description: 'เริ่ม transmission ไปยัง I2C device ตาม address (Wire.beginTransmission)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'address', type: 'number', label: 'Address (hex)', default: '0x3C', description: 'I2C address ของ device' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const addr = params.address ?? '0x3C';
				return {
					parts: [
						[`${pad}Wire.beginTransmission(${addr});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_write',
			name: 'I2C Write',
			color: '#0ea5e9',
			icon: '✍️',
			category: 'i2c',
			description: 'เขียนข้อมูล 1 byte ไปยัง I2C bus (Wire.write)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data', dataType: 'byte', description: 'ข้อมูลที่ต้องการส่ง' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'data', type: 'number', label: 'Data (byte)', default: '0', description: 'ข้อมูลที่จะส่ง (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const data = resolveInput('data') ?? params.data ?? '0';
				return {
					parts: [
						[`${pad}Wire.write(${data});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_end_transmission',
			name: 'I2C End Transmission',
			color: '#0ea5e9',
			icon: '🔚',
			category: 'i2c',
			description: 'สิ้นสุด transmission และส่งข้อมูลออก I2C bus (Wire.endTransmission)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' },
				{ id: 'status', type: 'output', label: 'Status', dataType: 'byte', description: 'สถานะ: 0=success' },
			],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}byte ${id} = Wire.endTransmission();`],
						{ portId: 'out', depthDelta: 0 },
						{ portId: 'status', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'i2c_request_from',
			name: 'I2C Request From',
			color: '#0ea5e9',
			icon: '📥',
			category: 'i2c',
			description: 'ขอรับข้อมูลจาก I2C device (Wire.requestFrom)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'address', type: 'number', label: 'Address (hex)', default: '0x3C', description: 'I2C address ของ device' },
				{ id: 'count', type: 'number', label: 'Bytes', default: '2', description: 'จำนวน byte ที่ต้องการรับ' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const addr = params.address ?? '0x3C';
				const count = params.count ?? '2';
				return {
					parts: [
						[`${pad}Wire.requestFrom(${addr}, ${count});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_available',
			name: 'I2C Available',
			color: '#0ea5e9',
			icon: '📊',
			category: 'i2c',
			description: 'ตรวจสอบจำนวน byte ที่รอรับอยู่ใน I2C buffer (Wire.available)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'count', type: 'output', label: 'Count', dataType: 'int', description: 'จำนวน byte ที่รออยู่ใน buffer' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = Wire.available();`],
						{ portId: 'count', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_read',
			name: 'I2C Read',
			color: '#0ea5e9',
			icon: '🔎',
			category: 'i2c',
			description: 'อ่าน 1 byte จาก I2C buffer (Wire.read)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'byte', description: 'byte ที่อ่านได้จาก I2C buffer' }],
			toCode({ pad, block, safeId, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}byte ${id} = Wire.read();`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_write_bytes',
			name: 'I2C Write Bytes',
			color: '#0ea5e9',
			icon: '📦',
			category: 'i2c',
			description: 'เขียนหลาย byte ไปยัง I2C bus ในคราวเดียว โดยระบุค่า HEX แต่ละ byte คั่นด้วยช่องว่าง เช่น "00 1A FF"',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{
					id: 'bytes',
					type: 'text',
					label: 'Bytes (HEX, space-separated)',
					default: '00 1A FF',
					description: 'ค่า HEX แต่ละ byte คั่นด้วยช่องว่าง เช่น 00 1A FF'
				},
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const id = safeId(block.id);
				const raw = (params.bytes ?? '00').trim();
				// Parse each token as hex byte, filter invalid ones
				const tokens = raw.split(/\s+/).filter((t) => /^[0-9a-fA-F]{1,2}$/.test(t));
				const byteList = tokens.map((t) => `0x${t.toUpperCase().padStart(2, '0')}`).join(', ');
				const len = tokens.length || 1;
				return {
					parts: [
						[
							`${pad}{ byte _buf_${id}[${len}] = {${byteList}};`,
							`${pad}  Wire.write(_buf_${id}, ${len}); }`,
						],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_mem_write',
			name: 'I2C Mem Write',
			color: '#0ea5e9',
			icon: '📝',
			category: 'i2c',
			description: 'เขียนข้อมูลไปยัง register address ภายใน I2C device (beginTransmission → write reg → write data → endTransmission)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'value', type: 'input', label: 'Value', dataType: 'int', description: 'ค่าที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'address', type: 'number', label: 'Device Addr (hex)', default: '0x68', description: 'I2C address ของ device' },
				{ id: 'reg', type: 'number', label: 'Register (hex)', default: '0x00', description: 'register address ภายใน device' },
				{ id: 'value', type: 'number', label: 'Value (dec)', default: '0', description: 'ค่าที่จะเขียน (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{
					id: 'size', type: 'option', label: 'Size',
					options: [
						{ label: 'Byte (1 byte)', value: 'byte' },
						{ label: 'Word (2 bytes)', value: 'word' },
					],
					description: 'ขนาดข้อมูลที่จะเขียน'
				},
				{
					id: 'endian', type: 'option', label: 'Endian',
					options: [
						{ label: 'Big-endian (BE)', value: 'BE' },
						{ label: 'Little-endian (LE).', value: 'LE' },
					],
					description: 'ลำดับไบต์ Big-endian / Little-endian'
				},
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const addr = params.address ?? '0x68';
				const reg = params.reg ?? '0x00';
				const size = params.size ?? 'byte';
				const endian = params.endian ?? 'BE';
				const value = resolveInput('value') ?? params.value ?? '0';
				const lines: string[] = [
					`${pad}Wire.beginTransmission(${addr});`,
					`${pad}Wire.write(${reg});`,
				];
				if (size === 'word') {
					if (endian === 'BE') {
						lines.push(`${pad}Wire.write((uint8_t)((${value}) >> 8));`);
						lines.push(`${pad}Wire.write((uint8_t)((${value}) & 0xFF));`);
					} else {
						lines.push(`${pad}Wire.write((uint8_t)((${value}) & 0xFF));`);
						lines.push(`${pad}Wire.write((uint8_t)((${value}) >> 8));`);
					}
				} else {
					lines.push(`${pad}Wire.write((uint8_t)(${value}));`);
				}
				lines.push(`${pad}Wire.endTransmission();`);
				return {
					parts: [
						lines,
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'i2c_mem_read',
			name: 'I2C Mem Read',
			color: '#0ea5e9',
			icon: '📖',
			category: 'i2c',
			description: 'อ่านข้อมูลจาก register address ภายใน I2C device (beginTransmission → write reg → endTransmission → requestFrom → read)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'int', description: 'ค่าที่อ่านได้ (byte = 0–255, word = 0–65535)' }],
			params: [
				{ id: 'address', type: 'number', label: 'Device Addr (hex)', default: '0x68', description: 'I2C address ของ device' },
				{ id: 'reg', type: 'number', label: 'Register (hex)', default: '0x00', description: 'register address ภายใน device' },
				{
					id: 'size', type: 'option', label: 'Size',
					options: [
						{ label: 'Byte (1 byte)', value: 'byte' },
						{ label: 'Word (2 bytes)', value: 'word' },
					],
					description: 'ขนาดข้อมูลที่จะอ่าน'
				},
				{
					id: 'endian', type: 'option', label: 'Endian',
					options: [
						{ label: 'Big-endian (BE)', value: 'BE' },
						{ label: 'Little-endian (LE).', value: 'LE' },
					],
					description: 'ลำดับไบต์ Big-endian / Little-endian'
				},
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				registerPreprocessor('#include <Wire.h>');
				const id = safeId(block.id);
				const addr = params.address ?? '0x68';
				const reg = params.reg ?? '0x00';
				const size = params.size ?? 'byte';
				const endian = params.endian ?? 'BE';
				const lines: string[] = [
					`${pad}Wire.beginTransmission(${addr});`,
					`${pad}Wire.write(${reg});`,
					`${pad}Wire.endTransmission(false);`,
					`${pad}Wire.requestFrom(${addr}, (uint8_t)${size === 'word' ? '2' : '1'});`,
				];
				if (size === 'word') {
					lines.push(`${pad}int ${id} = 0;`);
					lines.push(`${pad}if (Wire.available() >= 2) {`);
					lines.push(`${pad}  uint8_t ${id}_hi = Wire.read();`);
					lines.push(`${pad}  uint8_t ${id}_lo = Wire.read();`);
					if (endian === 'BE') {
						lines.push(`${pad}  ${id} = (${id}_hi << 8) | ${id}_lo;`);
					} else {
						lines.push(`${pad}  ${id} = (${id}_lo << 8) | ${id}_hi;`);
					}
					lines.push(`${pad}}`);
				} else {
					lines.push(`${pad}int ${id} = Wire.available() ? Wire.read() : 0;`);
				}
				return {
					parts: [
						lines,
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
	]
};
