import type { BlockCategory } from '../../../blocks/types.js';

const COLOR_UI = '#dc2626'; // red
const MATRIX_VAR = '_matrix';

// ─── printf helpers (local copy) ─────────────────────────────────────────────
function getPrintfSpecifiers(format: string): string[] {
	const matches = format.match(/%%|%[-+0 #]*(?:\*|\d+)?(?:\.(?:\*|\d+))?(?:hh?|ll?|[ljztL])?[diouxXeEfgGaAcspn]/g) ?? [];
	return matches.filter(m => m !== '%%').map(m => m[m.length - 1]);
}
function specifierToDataType(spec: string): string {
	if ('diouxX'.includes(spec)) return 'int';
	if ('eEfgGaA'.includes(spec)) return 'float';
	if (spec === 's') return 'String';
	if (spec === 'c') return 'char';
	return 'any';
}
function wrapPrintfArgs(args: string[], specs: string[]): string[] {
	return args.map((a, i) => specs[i] === 's' ? `String(${a}).c_str()` : a);
}

export const rgbmatrixCategory: BlockCategory = {
	name: 'RGB LED Matrix',
	blocks: [
		// ─── Begin ───────────────────────────────────────────────────────────
		{
			id: 'matrix_begin',
			name: 'Matrix Begin',
			color: COLOR_UI,
			icon: '🔴',
			category: 'RGBMatrix',
			description: 'เริ่มต้น RGB LED Matrix (HUB75) ต้องวางก่อนบล็อก Matrix อื่น ๆ ทั้งหมด',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'display', type: 'option', label: 'Display Model', options: [
						{ label: 'P4/P5 (64x32)', value: 'P4' },
						{ label: 'P10 (32x16)', value: 'P10' },
						{ label: 'Custom', value: 'CUSTOM' }
					]
				},
				{ id: 'width', type: 'number', label: 'Panel Width', default: '64', validation: (n: number) => Math.max(8, Math.trunc(n)), hidden: ({ params }) => params.display !== 'CUSTOM' },
				{ id: 'height', type: 'number', label: 'Panel Height', default: '32', validation: (n: number) => Math.max(8, Math.trunc(n)), hidden: ({ params }) => params.display !== 'CUSTOM' },
				{ id: 'bitdepth', type: 'number', label: 'Bit Depth (1–6)', default: '4', validation: (n: number) => Math.max(1, Math.min(6, Math.trunc(n))) },
				{ id: 'color_order', type: 'option', label: 'Color Order', options: [
					{ label: 'RGB', value: 'RGB' },
					{ label: 'BGR', value: 'BGR' },
				], default: 'RGB' },
				// ─── Options ─────────────────────────────────────────────────
				{
					id: 'doublebuffer', type: 'option', label: 'Double Buffer',
					options: [
						{ label: 'Yes (smoother animation)', value: '1' },
						{ label: 'No', value: '0' },
					],
					default: '1',
				},
			],
			toCode({ pad, params, registerPreprocessor, registerGlobal }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');

				type BoardPinsDefineType = {
					r1: number; g1: number; b1: number;
					r2: number; g2: number; b2: number;
					a: number; b: number; c: number; d: number; e?: number;
					clk: number;
					lat: number;
					oe: number;
				}

				const BOARD_PIN_DEFINE: Record<string, BoardPinsDefineType> = {
					'ESP-HUB75': {
						r1: 42, g1: 41, b1: 40,
						r2: 39, g2: 38, b2: 37,
						a: 48, b: 36, c: 45, d: 35,
						clk: 2,
						lat: 47,
						oe: 14
					},
					'ESP-HUB75-BGR': {
						r1: 40, g1: 41, b1: 42,
						r2: 37, g2: 38, b2: 39,
						a: 48, b: 36, c: 45, d: 35,
						clk: 2,
						lat: 47,
						oe: 14
					},
				};

				const width = params.width ?? '64';
				const height = params.height ?? '32';
				const bitdepth = params.bitdepth ?? '4';
				const color_order = params.color_order ?? 'RGB';
				const board = color_order === 'RGB' ? 'ESP-HUB75' : 'ESP-HUB75-BGR';

				const r1 = BOARD_PIN_DEFINE[board]?.r1 ?? '-1';
				const g1 = BOARD_PIN_DEFINE[board]?.g1 ?? '-1';
				const b1 = BOARD_PIN_DEFINE[board]?.b1 ?? '-1';
				const r2 = BOARD_PIN_DEFINE[board]?.r2 ?? '-1';
				const g2 = BOARD_PIN_DEFINE[board]?.g2 ?? '-1';
				const b2 = BOARD_PIN_DEFINE[board]?.b2 ?? '-1';

				const a = BOARD_PIN_DEFINE[board]?.a ?? '-1';
				const b_ = BOARD_PIN_DEFINE[board]?.b ?? '-1';
				const c = BOARD_PIN_DEFINE[board]?.c ?? '-1';
				const d = BOARD_PIN_DEFINE[board]?.d ?? '-1';
				const e = BOARD_PIN_DEFINE[board]?.e ?? '-1';

				const clk = BOARD_PIN_DEFINE[board]?.clk ?? '-1';
				const lat = BOARD_PIN_DEFINE[board]?.lat ?? '-1';
				const oe = BOARD_PIN_DEFINE[board]?.oe ?? '-1';
				const dbl = params.doublebuffer === '0' ? 'false' : 'true';

				// addr pin count depends on panel height
				const h = parseInt(height);
				const addrCount = h <= 8 ? 2 : h <= 16 ? 3 : h <= 32 ? 4 : 5;
				const addrPins = [a, b_, c, d, e].slice(0, addrCount);

				registerGlobal(`uint8_t _matrix_rgb[]  = { ${r1}, ${g1}, ${b1}, ${r2}, ${g2}, ${b2} };`);
				registerGlobal(`uint8_t _matrix_addr[] = { ${addrPins.join(', ')} };`);
				registerGlobal(`Adafruit_Protomatter ${MATRIX_VAR}(${width}, ${bitdepth}, 1, _matrix_rgb, ${addrCount}, _matrix_addr, ${clk}, ${lat}, ${oe}, ${dbl});`);

				return {
					parts: [
						[`${pad}${MATRIX_VAR}.begin();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Show ─────────────────────────────────────────────────────────────
		{
			id: 'matrix_show',
			name: 'Matrix Show',
			color: COLOR_UI,
			icon: '📺',
			category: 'RGBMatrix',
			description: 'ส่ง frame buffer ออก RGB Matrix (ต้องเรียกหลังวาดเสร็จทุกครั้ง)',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.show();`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Clear ────────────────────────────────────────────────────────────
		{
			id: 'matrix_clear',
			name: 'Matrix Clear',
			color: COLOR_UI,
			icon: '⬛',
			category: 'RGBMatrix',
			description: 'ล้างหน้าจอทั้งหมดเป็นสีดำ (fillScreen(0))\nต้องเรียก Matrix Show หลังจากนี้เพื่ออัปเดต',
			inputs: [{ id: 'in', type: 'input', label: '➜', dataType: 'any' }],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			toCode({ pad, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.fillScreen(0);`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Fill Screen ──────────────────────────────────────────────────────
		{
			id: 'matrix_fill_screen',
			name: 'Matrix Fill Screen',
			color: COLOR_UI,
			icon: '🟥',
			category: 'RGBMatrix',
			description: 'เติมหน้าจอทั้งหมดด้วยสีที่กำหนด\nใช้ Matrix Color RGB เพื่อสร้างค่าสี 16-bit',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color (16-bit)', default: '0xFFFF' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const color = resolveInput('color') ?? params.color ?? '0';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.fillScreen(${color});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Brightness ───────────────────────────────────────────────────────
		{
			id: 'matrix_brightness',
			name: 'Matrix Brightness',
			color: COLOR_UI,
			icon: '🔆',
			category: 'RGBMatrix',
			description: 'ปรับความสว่าง RGB Matrix (setDuty)\n0 = มืดสุด, 255 = สว่างสุด',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'value', type: 'input', label: 'Brightness', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{
					id: 'value', type: 'number', label: 'Brightness (0–255)', default: '128',
					validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n)))
				},
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const val = resolveInput('value') ?? params.value ?? '128';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.setDuty(${val});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Draw Pixel ───────────────────────────────────────────────────────
		{
			id: 'matrix_draw_pixel',
			name: 'Matrix Draw Pixel',
			color: COLOR_UI,
			icon: '🔴',
			category: 'RGBMatrix',
			description: 'วาด pixel เดี่ยวที่ตำแหน่ง (x, y)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'x', type: 'input', label: 'X', dataType: 'int' },
				{ id: 'y', type: 'input', label: 'Y', dataType: 'int' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x', type: 'number', label: 'X', default: '0' },
				{ id: 'y', type: 'number', label: 'Y', default: '0' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x = resolveInput('x') ?? params.x ?? '0';
				const y = resolveInput('y') ?? params.y ?? '0';
				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.drawPixel(${x}, ${y}, ${color});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Draw Line ────────────────────────────────────────────────────────
		{
			id: 'matrix_draw_line',
			name: 'Matrix Draw Line',
			color: COLOR_UI,
			icon: '📏',
			category: 'RGBMatrix',
			description: 'วาดเส้นตรงจากจุด (x0, y0) ถึง (x1, y1)',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'x0', type: 'input', label: 'X0', dataType: 'int' },
				{ id: 'y0', type: 'input', label: 'Y0', dataType: 'int' },
				{ id: 'x1', type: 'input', label: 'X1', dataType: 'int' },
				{ id: 'y1', type: 'input', label: 'Y1', dataType: 'int' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x0', type: 'number', label: 'X0', default: '0' },
				{ id: 'y0', type: 'number', label: 'Y0', default: '0' },
				{ id: 'x1', type: 'number', label: 'X1', default: '10' },
				{ id: 'y1', type: 'number', label: 'Y1', default: '10' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x0 = resolveInput('x0') ?? params.x0 ?? '0';
				const y0 = resolveInput('y0') ?? params.y0 ?? '0';
				const x1 = resolveInput('x1') ?? params.x1 ?? '10';
				const y1 = resolveInput('y1') ?? params.y1 ?? '10';
				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.drawLine(${x0}, ${y0}, ${x1}, ${y1}, ${color});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Draw Rect ────────────────────────────────────────────────────────
		{
			id: 'matrix_draw_rect',
			name: 'Matrix Draw Rect',
			color: COLOR_UI,
			icon: '⬜',
			category: 'RGBMatrix',
			description: 'วาดสี่เหลี่ยมเส้นขอบ (ไม่เติมสี) ที่ (x, y) ขนาด w×h',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'x', type: 'input', label: 'X', dataType: 'int' },
				{ id: 'y', type: 'input', label: 'Y', dataType: 'int' },
				{ id: 'w', type: 'input', label: 'Width', dataType: 'int' },
				{ id: 'h', type: 'input', label: 'Height', dataType: 'int' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x', type: 'number', label: 'X', default: '0' },
				{ id: 'y', type: 'number', label: 'Y', default: '0' },
				{ id: 'w', type: 'number', label: 'Width', default: '10' },
				{ id: 'h', type: 'number', label: 'Height', default: '10' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x = resolveInput('x') ?? params.x ?? '0';
				const y = resolveInput('y') ?? params.y ?? '0';
				const w = resolveInput('w') ?? params.w ?? '10';
				const h = resolveInput('h') ?? params.h ?? '10';
				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.drawRect(${x}, ${y}, ${w}, ${h}, ${color});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Fill Rect ────────────────────────────────────────────────────────
		{
			id: 'matrix_fill_rect',
			name: 'Matrix Fill Rect',
			color: COLOR_UI,
			icon: '🟥',
			category: 'RGBMatrix',
			description: 'วาดสี่เหลี่ยมทึบที่ (x, y) ขนาด w×h',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'x', type: 'input', label: 'X', dataType: 'int' },
				{ id: 'y', type: 'input', label: 'Y', dataType: 'int' },
				{ id: 'w', type: 'input', label: 'Width', dataType: 'int' },
				{ id: 'h', type: 'input', label: 'Height', dataType: 'int' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x', type: 'number', label: 'X', default: '0' },
				{ id: 'y', type: 'number', label: 'Y', default: '0' },
				{ id: 'w', type: 'number', label: 'Width', default: '10' },
				{ id: 'h', type: 'number', label: 'Height', default: '10' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x = resolveInput('x') ?? params.x ?? '0';
				const y = resolveInput('y') ?? params.y ?? '0';
				const w = resolveInput('w') ?? params.w ?? '10';
				const h = resolveInput('h') ?? params.h ?? '10';
				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				return {
					parts: [
						[`${pad}${MATRIX_VAR}.fillRect(${x}, ${y}, ${w}, ${h}, ${color});`],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Print Text ───────────────────────────────────────────────────────
		{
			id: 'matrix_print',
			name: 'Matrix Print',
			color: COLOR_UI,
			icon: '✏️',
			category: 'RGBMatrix',
			description: 'พิมพ์ข้อความที่ตำแหน่ง (x, y) พร้อมกำหนดสีและขนาด font',
			inputs: [
				{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
				{ id: 'x', type: 'input', label: 'X', dataType: 'int' },
				{ id: 'y', type: 'input', label: 'Y', dataType: 'int' },
				{ id: 'text', type: 'input', label: 'Text', dataType: 'String' },
				{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
			],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x', type: 'number', label: 'X', default: '0' },
				{ id: 'y', type: 'number', label: 'Y', default: '0' },
				{ id: 'text', type: 'text', label: 'Text', default: 'Hello' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
				{
					id: 'size', type: 'number', label: 'Text Size', default: '1',
					validation: (n: number) => Math.max(1, Math.trunc(n))
				},
			],
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x = resolveInput('x') ?? params.x ?? '0';
				const y = resolveInput('y') ?? params.y ?? '0';
				const text = resolveInput('text') ?? `"${(params.text ?? 'Hello').replaceAll('"', '\\"')}"`;
				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				const size = params.size ?? '1';
				return {
					parts: [
						[
							`${pad}${MATRIX_VAR}.setCursor(${x}, ${y});`,
							`${pad}${MATRIX_VAR}.setTextColor(${color});`,
							`${pad}${MATRIX_VAR}.setTextSize(${size});`,
							`${pad}${MATRIX_VAR}.setTextWrap(false);`,
							`${pad}${MATRIX_VAR}.print(${text});`,
						],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},
		{
			id: 'matrix_print_format',
			name: 'Matrix Print Format',
			color: COLOR_UI,
			icon: '✏️',
			category: 'RGBMatrix',
			description: 'พิมพ์ข้อความที่ตำแหน่ง (x, y) พร้อมกำหนดสีและขนาด font',
			inputs: [],
			outputs: [{ id: 'out', type: 'output', label: '➜', dataType: 'void' }],
			params: [
				{ id: 'x', type: 'number', label: 'X', default: '0' },
				{ id: 'y', type: 'number', label: 'Y', default: '0' },
				{ id: 'format', type: 'text', label: 'Format', default: 'Value=%d' },
				{ id: 'color', type: 'color', format: 'rgb565', label: 'Color', default: '0xFFFF' },
				{
					id: 'size', type: 'number', label: 'Text Size', default: '1',
					validation: (n: number) => Math.max(1, Math.trunc(n))
				},
			],
			dynamicPorts({ format }) {
				const specs = getPrintfSpecifiers(format ?? '%d');
				return {
					inputs: [
						{ id: 'in', type: 'input', label: '➜', dataType: 'any' },
						{ id: 'x', type: 'input', label: 'X', dataType: 'int' },
						{ id: 'y', type: 'input', label: 'Y', dataType: 'int' },
						...specs.map((spec, i) => ({
							id: `arg${i + 1}`, type: 'input' as const, label: `Arg ${i + 1}`, dataType: specifierToDataType(spec) as import('../../../blocks/types.js').DataType
						})),
						{ id: 'color', type: 'input', label: 'Color', dataType: 'int' },
					]
				};
			},
			toCode({ pad, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const x = resolveInput('x') ?? params.x ?? '0';
				const y = resolveInput('y') ?? params.y ?? '0';

				const fmt = (params.format ?? '%d').replaceAll('"', '\\"');
				const specs = getPrintfSpecifiers(fmt);
				const args = specs.map((_, i) => resolveInput(`arg${i + 1}`) ?? '0');
				const wrappedArgs = wrapPrintfArgs(args, specs);
				const argsPart = wrappedArgs.length > 0 ? `, ${wrappedArgs.join(', ')}` : '';

				const color = resolveInput('color') ?? params.color ?? '0xFFFF';
				const size = params.size ?? '1';
				return {
					parts: [
						[
							`${pad}${MATRIX_VAR}.setCursor(${x}, ${y});`,
							`${pad}${MATRIX_VAR}.setTextColor(${color});`,
							`${pad}${MATRIX_VAR}.setTextSize(${size});`,
							`${pad}${MATRIX_VAR}.setTextWrap(false);`,
							`${pad}${MATRIX_VAR}.printf("${fmt}"${argsPart});`,
						],
						{ portId: 'out', depthDelta: 0 },
					]
				};
			}
		},

		// ─── Color RGB ────────────────────────────────────────────────────────
		{
			id: 'matrix_color_rgb',
			name: 'Matrix Color RGB',
			color: COLOR_UI,
			icon: '🎨',
			category: 'RGBMatrix',
			description: 'แปลงสี RGB (0–255 ต่อช่อง) เป็นค่าสี 16-bit สำหรับ RGB Matrix (color565)',
			inputs: [
				{ id: 'r', type: 'input', label: 'R', dataType: 'int' },
				{ id: 'g', type: 'input', label: 'G', dataType: 'int' },
				{ id: 'b', type: 'input', label: 'B', dataType: 'int' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Color', dataType: 'int' }],
			params: [
				{ id: 'r', type: 'number', label: 'R (0–255)', default: '255', validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n))) },
				{ id: 'g', type: 'number', label: 'G (0–255)', default: '0', validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n))) },
				{ id: 'b', type: 'number', label: 'B (0–255)', default: '0', validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n))) },
			],
			toCode({ block, pad, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const id = safeId(block.id);
				const r = resolveInput('r') ?? params.r ?? '255';
				const g = resolveInput('g') ?? params.g ?? '0';
				const b = resolveInput('b') ?? params.b ?? '0';
				return {
					parts: [
						[`${pad}uint16_t ${id} = ${MATRIX_VAR}.color565(${r}, ${g}, ${b});`],
					]
				};
			}
		},

		// ─── Color HSV ────────────────────────────────────────────────────────
		{
			id: 'matrix_color_hsv',
			name: 'Matrix Color HSV',
			color: COLOR_UI,
			icon: '🌈',
			category: 'RGBMatrix',
			description: 'แปลงสี HSV เป็นค่าสี 16-bit สำหรับ RGB Matrix (colorHSV)\nHue 0–65535, Saturation 0–255, Value 0–255',
			inputs: [
				{ id: 'hue', type: 'input', label: 'Hue', dataType: 'int' },
				{ id: 'sat', type: 'input', label: 'Saturation', dataType: 'int' },
				{ id: 'val', type: 'input', label: 'Value', dataType: 'int' },
			],
			outputs: [{ id: 'value', type: 'output', label: 'Color', dataType: 'int' }],
			params: [
				{ id: 'hue', type: 'number', label: 'Hue (0–65535)', default: '0', validation: (n: number) => Math.max(0, Math.min(65535, Math.trunc(n))) },
				{ id: 'sat', type: 'number', label: 'Saturation (0–255)', default: '255', validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n))) },
				{ id: 'val', type: 'number', label: 'Value (0–255)', default: '255', validation: (n: number) => Math.max(0, Math.min(255, Math.trunc(n))) },
			],
			toCode({ block, pad, safeId, params, resolveInput, registerPreprocessor }) {
				registerPreprocessor('#include <Adafruit_Protomatter.h>');
				const id = safeId(block.id);
				const hue = resolveInput('hue') ?? params.hue ?? '0';
				const sat = resolveInput('sat') ?? params.sat ?? '255';
				const val = resolveInput('val') ?? params.val ?? '255';
				return {
					parts: [
						[`${pad}uint16_t ${id} = ${MATRIX_VAR}.colorHSV(${hue}, ${sat}, ${val});`],
					]
				};
			}
		},

		// ─── Width / Height ───────────────────────────────────────────────────
		{
			id: 'matrix_width',
			name: 'Matrix Width',
			color: COLOR_UI,
			icon: '↔️',
			category: 'RGBMatrix',
			description: 'ความกว้างของ RGB Matrix (pixel)',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Width', dataType: 'int' }],
			toExpr: () => `${MATRIX_VAR}.width()`,
			toCode() { return { parts: [] }; }
		},
		{
			id: 'matrix_height',
			name: 'Matrix Height',
			color: COLOR_UI,
			icon: '↕️',
			category: 'RGBMatrix',
			description: 'ความสูงของ RGB Matrix (pixel)',
			inputs: [],
			outputs: [{ id: 'value', type: 'output', label: 'Height', dataType: 'int' }],
			toExpr: () => `${MATRIX_VAR}.height()`,
			toCode() { return { parts: [] }; }
		},
	]
};
