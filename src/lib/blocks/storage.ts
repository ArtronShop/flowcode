import type { BlockCategory } from './types.js';

const FS_OPTIONS = [
	{ label: 'LittleFS', value: 'LittleFS' },
	{ label: 'SPIFFS', value: 'SPIFFS' },
];

function registerFs(fs: string, registerPreprocessor: (d: string) => void) {
	if (fs === 'SPIFFS') {
		registerPreprocessor('#include "SPIFFS.h"');
	} else {
		registerPreprocessor('#include "LittleFS.h"');
	}
	registerPreprocessor('#define FILE_SYSTEM ' + fs);
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
				{ id: 'ok',    type: 'output', label: 'OK',    dataType: 'void', description: 'ถ้าเริ่มต้นสำเร็จ' },
				{ id: 'error', type: 'output', label: 'Error', dataType: 'void', description: 'ถ้าไม่สำเร็จ' },
				{ id: 'out',   type: 'output', label: '➜',     dataType: 'void', description: 'ส่งต่อเสมอหลัง if/else' },
			],
			params: [
				{ id: 'fs', type: 'option', label: 'Filesystem', options: FS_OPTIONS, description: 'ชนิด filesystem' },
				{ id: 'format', type: 'option', label: 'Format if fail', options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }], description: 'format อัตโนมัติถ้า mount ไม่ได้' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				const fs = params.fs ?? 'LittleFS';
				const format = params.format ?? 'false';
				registerFs(fs, registerPreprocessor);
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}if (FILE_SYSTEM.begin(${format})) {`],
						{ portId: 'ok', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'error', depthDelta: 1 },
						[`${pad}}`],
						{ portId: 'out', depthDelta: 0 },
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
				{ id: 'in', type: 'input', label: '➜', dataType: 'any', description: 'รับสายลำดับการทำงานจากบล็อกก่อนหน้า' },
				{ id: 'data', type: 'input', label: 'Data', dataType: 'String', description: 'ข้อมูลที่ต้องการเขียน' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void', description: 'ส่งสายลำดับการทำงานต่อไป' }],
			params: [
				{ id: 'path', type: 'text', label: 'Path', default: '/data.txt', description: 'path ของไฟล์' },
				{
					id: 'mode', type: 'option', label: 'Mode',
					options: [
						{ label: 'Write', value: 'FILE_WRITE' },
						{ label: 'Append', value: 'FILE_APPEND' },
					],
					description: 'โหมดการเปิดไฟล์'
				},
				{ id: 'data', type: 'text', label: 'Text', default: '', description: 'ข้อความ (ใช้เมื่อไม่มีบล็อกต่อเข้ามา)' },
				{
					id: 'newline', type: 'option', label: 'New line',
					options: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }],
					description: 'เพิ่ม newline ต่อท้าย'
				},
			],
			toCode({ pad, params, resolveInput, block, safeId }) {
				const varname = safeId(block.id) + '_f';
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				const mode = params.mode ?? 'FILE_READ';
				const newline = params.newline ?? '0';
				const data = resolveInput('data') ?? `"${(params.data ?? '').replaceAll('"', '\\"')}"`;
				const fn = newline === '1' ? 'println' : 'print';
				return {
					parts: [
						[`${pad}File ${varname} = FILE_SYSTEM.open("${path}", ${mode});`],
						[`${pad}${varname}.${fn}(${data});`],
						[`${pad}${varname}.close();`],
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
				{ id: 'path', type: 'text', label: 'Path', default: '/data.txt', description: 'path ของไฟล์' },
			],
			toCode({ pad, block, safeId, params }) {
				const varname = safeId(block.id) + '_f';
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}File ${varname} = FILE_SYSTEM.open("${path}", FILE_READ);`],
						[`${pad}String ${id} = ${varname}.readString();`],
						[`${pad}${varname}.close();`],
						{ portId: 'value', depthDelta: 0 }
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
			outputs: [
				{ id: 'exists', type: 'output', label: 'Exists', dataType: 'void', description: 'ถ้าไฟล์มีอยู่' },
				{ id: 'no_exists', type: 'output', label: 'No exists', dataType: 'void', description: 'ถ้าไฟล์ไม่มีอยู่' },
			],
			params: [
				{ id: 'path', type: 'text', label: 'Path', default: '/data.txt' },
			],
			toCode({ pad, block, safeId, params, registerPreprocessor }) {
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				const id = safeId(block.id);
				return {
					parts: [
						[`${pad}if (FILE_SYSTEM.exists("${path}")) {`],
						{ portId: 'exists', depthDelta: 1 },
						[`${pad}} else {`],
						{ portId: 'no_exists', depthDelta: 1 },
						[`${pad}}`],
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
				{ id: 'path', type: 'text', label: 'Path', default: '/data.txt' },
			],
			toCode({ pad, params, registerPreprocessor }) {
				const fs = params.fs ?? 'LittleFS';
				const path = (params.path ?? '/data.txt').replaceAll('"', '\\"');
				registerFs(fs, registerPreprocessor);
				return {
					parts: [
						[`${pad}FILE_SYSTEM.remove("${path}");`],
						{ portId: 'out', depthDelta: 0 }
					]
				};
			}
		},
	]
};
