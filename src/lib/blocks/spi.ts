import type { BlockCategory } from './types.js';

export const spiCategory: BlockCategory = {
	name: 'SPI',
	blocks: [
		{
			id: 'spi_begin',
			name: 'SPI Begin',
			color: '#f59e0b',
			icon: '🔌',
			category: 'spi',
			description: 'เริ่มต้น SPI bus (SPI.begin) กำหนดขา SCK, MISO, MOSI, SS',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'sck',  type: 'number', label: 'SCK Pin',  default: '18', description: 'ขา Clock' },
				{ id: 'miso', type: 'number', label: 'MISO Pin', default: '19', description: 'ขา MISO' },
				{ id: 'mosi', type: 'number', label: 'MOSI Pin', default: '23', description: 'ขา MOSI' },
				{ id: 'ss',   type: 'number', label: 'SS Pin',   default: '5',  description: 'ขา Slave Select' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <SPI.h>');
				const sck  = params.sck  ?? '18';
				const miso = params.miso ?? '19';
				const mosi = params.mosi ?? '23';
				const ss   = params.ss   ?? '5';
				return {
					parts: [
						[`${pad}SPI.begin(${sck}, ${miso}, ${mosi}, ${ss});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'spi_begin_transaction',
			name: 'SPI Begin Transaction',
			color: '#f59e0b',
			icon: '▶️',
			category: 'spi',
			description: 'เริ่ม SPI transaction กำหนด clock speed, bit order และ SPI mode (SPI.beginTransaction)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'speed', type: 'number', label: 'Speed (Hz)', default: '1000000', description: 'ความเร็ว clock สูงสุด' },
				{
					id: 'bitorder', type: 'option', label: 'Bit Order', default: 'MSBFIRST',
					options: [{ label: 'MSBFIRST', value: 'MSBFIRST' }, { label: 'LSBFIRST', value: 'LSBFIRST' }],
					description: 'ลำดับ bit ที่ส่งก่อน'
				},
				{
					id: 'mode', type: 'option', label: 'SPI Mode', default: 'SPI_MODE0',
					options: [
						{ label: 'MODE0', value: 'SPI_MODE0' },
						{ label: 'MODE1', value: 'SPI_MODE1' },
						{ label: 'MODE2', value: 'SPI_MODE2' },
						{ label: 'MODE3', value: 'SPI_MODE3' },
					],
					description: 'SPI mode (CPOL/CPHA)'
				},
			],
			toCode({ pad, params, registerPreprocessor }) {
				registerPreprocessor('#include <SPI.h>');
				const speed    = params.speed    ?? '1000000';
				const bitorder = params.bitorder ?? 'MSBFIRST';
				const mode     = params.mode     ?? 'SPI_MODE0';
				return {
					parts: [
						[`${pad}SPI.beginTransaction(SPISettings(${speed}, ${bitorder}, ${mode}));`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'spi_transfer',
			name: 'SPI Transfer',
			color: '#f59e0b',
			icon: '↔️',
			category: 'spi',
			description: 'รับ-ส่ง 1 byte ผ่าน SPI bus พร้อมกัน (SPI.transfer)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',   dataType: 'any',  description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data', dataType: 'byte', description: 'byte ที่ต้องการส่ง' },
			],
			outputs: [
				{ id: 'out',      type: 'output', label: '➜',      dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' },
				{ id: 'received', type: 'output', label: 'Received', dataType: 'byte', description: 'byte ที่รับกลับมาจาก slave' },
			],
			params: [
				{ id: 'data', type: 'number', label: 'Data (byte)', default: '0', description: 'byte ที่ส่ง (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
			],
			toCode({ pad, block, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <SPI.h>');
				const id   = safeId(block.id);
				const data = resolveInput('data') ?? params.data ?? '0';
				return {
					parts: [
						[`${pad}byte ${id} = SPI.transfer(${data});`],
						{ portId: 'out', depthDelta: 0 },
						{ portId: 'received', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'spi_end_transaction',
			name: 'SPI End Transaction',
			color: '#f59e0b',
			icon: '⏹️',
			category: 'spi',
			description: 'สิ้นสุด SPI transaction (SPI.endTransaction)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <SPI.h>');
				return {
					parts: [
						[`${pad}SPI.endTransaction();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'spi_end',
			name: 'SPI End',
			color: '#f59e0b',
			icon: '🔴',
			category: 'spi',
			description: 'ปิดการใช้งาน SPI bus (SPI.end)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <SPI.h>');
				return {
					parts: [
						[`${pad}SPI.end();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
