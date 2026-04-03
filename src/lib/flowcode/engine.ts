import type { CanvasBlock, Connection, BlockDef, ChildRef } from '$lib/blocks/types.js';
import { blockCategories } from '$lib/blocks/index.js';

const defaultDefMap: Record<string, BlockDef> = Object.fromEntries(
	blockCategories.flatMap((c) => c.blocks).map((b) => [b.id, b])
);

/**
 * แปลง canvas blocks + connections เป็น C code สำหรับ Arduino / ESP32
 * @param canvasBlocks  บล็อกทั้งหมดบน canvas
 * @param connections   เส้นเชื่อมต่อทั้งหมด
 * @param defMap        map จาก typeId → BlockDef (default: blockDefMap จาก blocks/index)
 */
export function flowToC(
	canvasBlocks: CanvasBlock[],
	connections: Connection[],
	defMap: Record<string, BlockDef> = defaultDefMap
): string {
	const triggerBlocks = canvasBlocks.filter((b) => b.trigger);
	if (triggerBlocks.length === 0) {
		return '// ไม่พบบล็อก Trigger\n// ลาก Trigger block มาวางใน Canvas ก่อน';
	}

	const visited = new Set<string>();
	const INDENT = '  ';
	const preprocessors = new Set<string>(['#include <Arduino.h>']);
	const globals = new Set<string>();
	const functionDecls = new Map<string, string>(); // header → declaration
	const functionDefs = new Map<string, string>();   // header → full def
	const safeId = (id: string) => id.replace(/-/g, '_');

	function registerFunction(header: string, body: string, declaration?: string) {
		if (functionDefs.has(header)) return;
		if (declaration) functionDecls.set(header, declaration);
		functionDefs.set(header, `${header} {\n${body}\n}`);
	}

	function registerPreprocessor(directive: string) {
		preprocessors.add(directive.trim());
	}

	function registerGlobal(declaration: string) {
		globals.add(declaration.trim());
	}

	function resolveInput(blockId: string, portId: string): string | null {
		const conn = connections.find((c) => c.toBlockId === blockId && c.toPortId === portId);
		if (!conn) return null;
		const fromBlock = canvasBlocks.find((b) => b.id === conn.fromBlockId);
		if (!fromBlock) return null;
		const fromDef = defMap[fromBlock.typeId];
		if (fromDef?.toExpr) return fromDef.toExpr(fromBlock.params ?? {});
		if (fromBlock.outputs?.[0]?.dataType === 'void') return null;
		return safeId(fromBlock.id);
	}

	function captureCode(fromBlockId: string, portId: string, baseDepth: number): string {
		const conns = connections.filter(
			(c) => c.fromBlockId === fromBlockId && c.fromPortId === portId
		);
		if (conns.length === 0) return '';
		const buf: string[] = [];
		const visitedSet = new Set<string>();
		for (const conn of conns) {
			traverseTo(conn.toBlockId, baseDepth, buf, visitedSet);
		}
		return buf.join('\n');
	}

	function traverseTo(
		blockId: string,
		depth: number,
		target: string[],
		visitedSet: Set<string>
	): void {
		if (visitedSet.has(blockId)) return;
		visitedSet.add(blockId);

		const block = canvasBlocks.find((b) => b.id === blockId);
		if (!block) return;

		const def = defMap[block.typeId];
		if (!def) {
			target.push(`${INDENT.repeat(depth)}/* unknown: ${block.name} */`);
			return;
		}

		// Pre-emit data-source blocks: บล็อกที่ต่อเข้ามาทาง data input และต้องการ statement
		// (มี toCode แต่ไม่มี toExpr และ output port ไม่ใช่ void)
		for (const conn of connections.filter((c) => c.toBlockId === blockId)) {
			const src = canvasBlocks.find((b) => b.id === conn.fromBlockId);
			if (!src || visitedSet.has(src.id)) continue;
			const srcDef = defMap[src.typeId];
			if (!srcDef || srcDef.toExpr) continue;
			const srcPort = src.outputs.find((p) => p.id === conn.fromPortId);
			if (!srcPort || srcPort.dataType === 'void') continue;
			traverseTo(src.id, depth, target, visitedSet);
		}

		let result;
		try {
			result = def.toCode({
				block,
				params: block.params ?? {},
				depth,
				pad: INDENT.repeat(depth),
				safeId,
				captureCode: (portId, baseDepth) =>
					captureCode(blockId, portId, baseDepth ?? depth + 1),
				registerFunction,
				registerPreprocessor,
				registerGlobal,
				resolveInput: (portId) => resolveInput(blockId, portId)
			});
		} catch (err) {
			target.push(
				`${INDENT.repeat(depth)}/* error: ${err instanceof Error ? err.message : String(err)} */`
			);
			return;
		}

		for (const part of result.parts) {
			if (Array.isArray(part)) {
				target.push(...part);
			} else {
				const child = part as ChildRef;
				const childConns = connections.filter(
					(c) => c.fromBlockId === blockId && c.fromPortId === child.portId
				);
				for (const conn of childConns) {
					traverseTo(conn.toBlockId, depth + child.depthDelta, target, visitedSet);
				}
			}
		}
	}

	const setupLines: string[] = ['void setup() {'];
	for (const trigger of triggerBlocks) {
		traverseTo(trigger.id, 1, setupLines, visited);
	}
	setupLines.push('}');

	const sections: string[] = [];

	// 1. preprocessor directives
	sections.push([...preprocessors].join('\n'));

	// 2. forward declarations
	if (functionDecls.size > 0) {
		sections.push([...functionDecls.values()].join('\n'));
	}

	// 3. global variables
	if (globals.size > 0) {
		sections.push([...globals].join('\n'));
	}

	// 4. setup()
	sections.push(setupLines.join('\n'));

	// 5. loop()
	sections.push('void loop() { }');

	// 6. function definitions
	if (functionDefs.size > 0) {
		sections.push([...functionDefs.values()].join('\n\n'));
	}

	return sections.join('\n\n');
}
