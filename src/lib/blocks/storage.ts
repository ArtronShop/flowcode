import type { BlockCategory } from './types.js';

const FS_OPTIONS = [
	{ label: 'LittleFS', value: 'LittleFS' },
	{ label: 'SPIFFS',   value: 'SPIFFS' },
];

function registerFs(fs: string, registerPreprocessor: (d: string) => void) {
	if (fs === 'SPIFFS') {
		registerPreprocessor('#include "SPIFFS.h"');
	} else {
		registerPreprocessor('#include "LittleFS.h"');
	}
}

export const storageCategory: BlockCategory = {
	name: 'Storage (FS)',
	blocks: [
		{
			id: 'fs_begin',
			name: 'FS Begin',
			color: '#8b5cf6',
			icon: '🗄️',
			category: 'storage',
			description: 'เริ่มต้น Filesystem (LittleFS / SPIFFS) — ควรเรียกใน setup()',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [
				{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' },
				{ id: 'ok',  type: 'output', label: 'OK',  dataType: 'bool', description: 'true ถ้า mount สำเร็จ' },
			],
			params: [
				{ id: 'fs',       type: 'option', label: 'Filesystem', options: FS_OPTIONS, description: 'ชนิด filesystem' },
				{ id: 'format',   type: 'option', label: 'Format if fail', options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }], description: 'format อัตโนมัติถ้า mount ไม่ได้' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				const fs     = params.fs     ?? 'LittleFS';
				const format = params.format ?? 'false';
				registerFs(fs, registerPreprocessor);
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}bool ${id} = ${fs}.begin(${format});`],
						{ portId: 'out', depthDelta: 0 },
						{ portId: 'ok', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'fs_open',
			name: 'FS Open File',
			color: '#8b5cf6',
			icon: '📂',
			category: 'storage',
			description: 'เปิดไฟล์บน Filesystem คืนตัวแปร File สำหรับใช้งาน',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'fs',   type: 'option', label: 'Filesystem', options: FS_OPTIONS },
				{ id: 'path', type: 'text',   label: 'Path',   default: '/data.txt', description: 'path ของไฟล์' },
				{
					id: 'mode', type: 'option', label: 'Mode',
					options: [
						{ label: 'Read',   value: 'FILE_READ'   },
						{ label: 'Write',  value: 'FILE_WRITE'  },
						{ label: 'Append', value: 'FILE_APPEND' },
					],
					description: 'โหมดการเปิดไฟล์'
				},
				{ id: 'varname', type: 'text', label: 'Variable name', default: 'myFile', description: 'ชื่อตัวแปร File ที่จะสร้าง' },
			],
			toCode({ pad, params, registerPreprocessor, registerGlobal }) {
				const fs      = params.fs      ?? 'LittleFS';
				const path    = (params.path    ?? '/data.txt').replaceAll('"', '\\"');
				const mode    = params.mode    ?? 'FILE_READ';
				const varname = params.varname ?? 'myFile';
				registerFs(fs, registerPreprocessor);
				registerGlobal(`File ${varname};`);
				return {
					parts: [
						[`${pad}${varname} = ${fs}.open("${path}", ${mode});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_write',
			name: 'FS Write',
			color: '#8b5cf6',
			icon: '✏️',
			category: 'storage',
			description: 'เขียน String ลงไฟล์ที่เปิดไว้ (file.print)',
			inputs: [
				{ id: 'in',   type: 'input', label: '➜',    dataType: 'any',    description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data',  dataType: 'String', description: 'ข้อมูลที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text', label: 'File variable', default: 'myFile', description: 'ชื่อตัวแปร File ที่เปิดไว้แล้ว' },
				{ id: 'data',    type: 'text', label: 'Text',          default: '',        description: 'ข้อความ (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{
					id: 'newline', type: 'option', label: 'New line',
					options: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }],
					description: 'เพิ่ม newline ต่อท้าย'
				},
			],
			toCode({ pad, params, resolveInput }) {
				const varname  = params.varname  ?? 'myFile';
				const newline  = params.newline  ?? '0';
				const data     = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;
				const fn       = newline === '1' ? 'println' : 'print';
				return {
					parts: [
						[`${pad}${varname}.${fn}(${data});`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_read_string',
			name: 'FS Read String',
			color: '#8b5cf6',
			icon: '📖',
			category: 'storage',
			description: 'อ่าน String ทั้งหมดจากไฟล์ (file.readString)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'value', type: 'output', label: 'Value', dataType: 'String', description: 'เนื้อหาของไฟล์' }],
			params: [
				{ id: 'varname', type: 'text', label: 'File variable', default: 'myFile', description: 'ชื่อตัวแปร File ที่เปิดไว้แล้ว' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'myFile';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}String ${id} = ${varname}.readString();`],
						{ portId: 'value', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_available',
			name: 'FS Available',
			color: '#8b5cf6',
			icon: '📊',
			category: 'storage',
			description: 'ตรวจสอบว่าไฟล์มีข้อมูลรอให้อ่านอยู่หรือไม่ (file.available)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'count', type: 'output', label: 'Count', dataType: 'int', description: 'จำนวน byte ที่ยังอ่านได้' }],
			params: [
				{ id: 'varname', type: 'text', label: 'File variable', default: 'myFile' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = params.varname ?? 'myFile';
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}int ${id} = ${varname}.available();`],
						{ portId: 'count', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_close',
			name: 'FS Close File',
			color: '#8b5cf6',
			icon: '🔒',
			category: 'storage',
			description: 'ปิดไฟล์และ flush ข้อมูลลง storage (file.close)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'varname', type: 'text', label: 'File variable', default: 'myFile' },
			],
			toCode({ pad, params }) {
				const varname = params.varname ?? 'myFile';
				return {
					parts: [
						[`${pad}${varname}.close();`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_exists',
			name: 'FS Exists',
			color: '#8b5cf6',
			icon: '🔍',
			category: 'storage',
			description: 'ตรวจสอบว่าไฟล์มีอยู่บน Filesystem หรือไม่',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'result', type: 'output', label: 'Exists', dataType: 'bool', description: 'true ถ้าไฟล์มีอยู่' }],
			params: [
				{ id: 'fs',   type: 'option', label: 'Filesystem', options: FS_OPTIONS },
				{ id: 'path', type: 'text',   label: 'Path',       default: '/data.txt' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				const fs   = params.fs   ?? 'LittleFS';
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				registerFs(fs, registerPreprocessor);
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}bool ${id} = ${fs}.exists("${path}");`],
						{ portId: 'result', depthDelta: 0 }
					]
				};
			}
		},
		{
			id: 'fs_remove',
			name: 'FS Remove',
			color: '#8b5cf6',
			icon: '🗑️',
			category: 'storage',
			description: 'ลบไฟล์ออกจาก Filesystem',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'fs',   type: 'option', label: 'Filesystem', options: FS_OPTIONS },
				{ id: 'path', type: 'text',   label: 'Path',       default: '/data.txt' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				const fs   = params.fs   ?? 'LittleFS';
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				registerFs(fs, registerPreprocessor);
				return {
					parts: [
						[`${pad}${fs}.remove("${path}");`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
