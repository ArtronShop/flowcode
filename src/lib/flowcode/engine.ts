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

	const lines: string[] = ['#include <Arduino.h>', '{{FUNCTION_DECL}}', '', 'void setup() {'];
	const visited = new Set<string>();
	const INDENT = '  ';
	const functionDecls: string[] = [];
	const functionDefs: string[] = [];
	const safeId = (id: string) => id.replace(/-/g, '_');

	function registerFunction(header: string, body: string, declaration?: string) {
		if (declaration) functionDecls.push(declaration);
		functionDefs.push(`${header} {\n${body}\n}`);
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

	for (const trigger of triggerBlocks) {
		traverseTo(trigger.id, 1, lines, visited);
	}
	lines.push('}');
	lines.push('');
	lines.push('void loop() { }');
	if (functionDefs.length > 0) {
		lines.push('');
		lines.push(...functionDefs);
	}
	const declBlock = functionDecls.length > 0 ? functionDecls.join('\n') : '';
	return lines.join('\n').replace('{{FUNCTION_DECL}}', declBlock);
}
