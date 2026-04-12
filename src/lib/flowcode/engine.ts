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
	const polling = new Set<string>();
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

	function registerPollingCode(code: string) {
		polling.add(code.trim());
	}

	/**
	 * เลือก connection ที่ถูกต้องสำหรับ input port ของบล็อกนั้น โดยคำนึงถึง branch ปัจจุบัน
	 *
	 * Priority:
	 *   1. Source ที่อยู่ใน visitedSet แล้ว → บล็อกนี้ถูก execute ใน branch ปัจจุบัน
	 *   2. Pure data block (ไม่มี flow input ต่อเข้ามา) → ใช้ได้ทุก branch
	 *   3. fallback conns[0]
	 */
	function resolveConnection(blockId: string, portId: string, visitedSet: Set<string>): Connection | null {
		const conns = connections.filter((c) => c.toBlockId === blockId && c.toPortId === portId);
		if (conns.length === 0) return null;
		if (conns.length === 1) return conns[0];

		// 1. prefer source already visited in this branch
		const visitedConn = conns.find((c) => visitedSet.has(c.fromBlockId));
		if (visitedConn) return visitedConn;

		// 2. prefer pure data block (no connected flow input port 'in')
		const dataConn = conns.find(
			(c) => !connections.some((fc) => fc.toBlockId === c.fromBlockId && fc.toPortId === 'in')
		);
		if (dataConn) return dataConn;

		return conns[0];
	}

	function resolveInput(blockId: string, portId: string, visitedSet: Set<string>): string | null {
		const conn = resolveConnection(blockId, portId, visitedSet);
		if (!conn) return null;
		const fromBlock = canvasBlocks.find((b) => b.id === conn.fromBlockId);
		if (!fromBlock) return null;
		const fromDef = defMap[fromBlock.typeId];
		if (fromDef?.toExpr) return fromDef.toExpr(fromBlock.params ?? {});
		const fromPort = fromBlock.outputs?.find((p) => p.id === conn.fromPortId);
		if (!fromPort || fromPort.dataType === 'void' || fromPort.dataType === 'any') return null;
		return safeId(fromBlock.id);
	}

	function captureCode(fromBlockId: string, portId: string, baseDepth: number): string {
		const conns = connections.filter(
			(c) => c.fromBlockId === fromBlockId && c.fromPortId === portId
		);
		if (conns.length === 0) return '';
		const buf: string[] = [];
		// Seed with fromBlockId so the source block cannot be re-traversed
		// inside its own captureCode (prevents infinite recursion with make_function)
		const visitedSet = new Set<string>([fromBlockId]);
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

		// Pre-emit data-source blocks: สำหรับแต่ละ data input port ของบล็อกนี้
		// ให้เลือก source ที่ถูกต้องตาม branch ปัจจุบัน (1 port → 1 source)
		// ใช้ resolveConnection เพื่อไม่ให้ดึง source ผิดฝั่ง
		const preEmittedPorts = new Set<string>();
		for (const conn of connections.filter((c) => c.toBlockId === blockId)) {
			if (preEmittedPorts.has(conn.toPortId)) continue; // port นี้เลือก source ไปแล้ว

			const anyConnSrc = canvasBlocks.find((b) => b.id === conn.fromBlockId);
			if (!anyConnSrc) continue;
			const anyConnSrcDef = defMap[anyConnSrc.typeId];
			if (!anyConnSrcDef || anyConnSrcDef.toExpr) continue;
			const anyConnSrcPort = anyConnSrc.outputs.find((p) => p.id === conn.fromPortId);
			if (!anyConnSrcPort || anyConnSrcPort.dataType === 'void' || anyConnSrcPort.dataType === 'any') continue;

			// port นี้เป็น data port — เลือก source ที่ถูกต้องตาม branch
			preEmittedPorts.add(conn.toPortId);
			const bestConn = resolveConnection(blockId, conn.toPortId, visitedSet);
			if (!bestConn) continue;
			const bestSrc = canvasBlocks.find((b) => b.id === bestConn.fromBlockId);
			if (!bestSrc || visitedSet.has(bestSrc.id)) continue;
			traverseTo(bestSrc.id, depth, target, visitedSet);
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
				registerPollingCode,
				resolveInput: (portId) => resolveInput(blockId, portId, visitedSet)
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
			} else if ('waitPortId' in part) {
				// Wait-for-input: traverse all blocks connected to this INPUT port first
				// ใช้ visitedSet ร่วมกัน เพื่อไม่ให้บล็อกที่ถูก traverse ไปแล้วถูกซ้ำ
				const waitConns = connections.filter(
					(c) => c.toBlockId === blockId && c.toPortId === part.waitPortId
				);
				for (const conn of waitConns) {
					if (!visitedSet.has(conn.fromBlockId)) {
						traverseTo(conn.fromBlockId, depth, target, visitedSet);
					}
				}
			} else {
				const child = part;
				const childConns = connections.filter(
					(c) => c.fromBlockId === blockId && c.fromPortId === child.portId
				);
				if (child.depthDelta > 0) {
					// Branch port (if/else body, loop body, etc.)
					// Each branch gets an independent copy of visitedSet so the same
					// downstream block can appear in multiple branches without being skipped.
					for (const conn of childConns) {
						traverseTo(conn.toBlockId, depth + child.depthDelta, target, new Set(visitedSet));
					}
				} else {
					// Continuation port (out ➜) — use shared visitedSet to avoid duplication
					for (const conn of childConns) {
						traverseTo(conn.toBlockId, depth + child.depthDelta, target, visitedSet);
					}
				}
			}
		}
	}

	const setupLines: string[] = ['void setup() {'];
	for (const trigger of triggerBlocks) {
		traverseTo(trigger.id, 1, setupLines, visited);
	}
	setupLines.push('}');

	const loopLines: string[] = [
		'void loop() {',
		[...polling].map(a => (INDENT + a.replaceAll('\n', '\n' + INDENT))).join('\n').trimEnd(),
		'  delay(2);',
		'}'
	];

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
	sections.push(loopLines.join('\n'));

	// 6. function definitions
	if (functionDefs.size > 0) {
		sections.push([...functionDefs.values()].join('\n\n'));
	}

	return sections.join('\n\n');
}
