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
	]
};
