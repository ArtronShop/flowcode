<script lang="ts">
	import {
		blockCategories,
		blockDefMap
	} from '$lib/blocks/index.js';
	import type { CanvasBlock, Connection, BlockDef, ChildRef } from '$lib/blocks/index.js';

		let canvasBlocks = $state<CanvasBlock[]>([]);
	let connections = $state<Connection[]>([]);
	let showUserMenu = $state(false);
	let searchQuery = $state('');

	let draggingFromPalette = $state<BlockDef | null>(null);
	let draggingBlock = $state<{
		id: string;
		offsetX: number;
		offsetY: number;
	} | null>(null);

	let connectingFrom = $state<{ blockId: string; portId: string } | null>(null);
	let mousePos = $state({ x: 0, y: 0 });
	let selectedConnId = $state<string | null>(null);
	let draggingConnEnd = $state<{ connId: string; end: 'from' | 'to' } | null>(null);

	let canvas: HTMLElement;
	let nextId = 1;

	const BLOCK_WIDTH = 130;
	const BLOCK_HEADER = 36;
	const PORT_ROW_H = 18;
	const PORT_R = 6;
	const GRID_SIZE = 20;

	// ─── Viewport state ────────────────────────────────────────────
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStart = { x: 0, y: 0 };

	const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

	function toCanvasCoords(clientX: number, clientY: number) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (clientX - rect.left - panX) / zoom,
			y: (clientY - rect.top - panY) / zoom
		};
	}

	function blockHeight(block: CanvasBlock) {
		return BLOCK_HEADER + Math.max(block.inputs.length, block.outputs.length) * PORT_ROW_H + 8;
	}

	function portY(block: CanvasBlock, index: number, total: number) {
		return block.y + BLOCK_HEADER + PORT_ROW_H * index + PORT_ROW_H / 2;
	}

	const filteredCategories = $derived(
		blockCategories
			.map((cat) => ({
				...cat,
				blocks: cat.blocks.filter((b) =>
					b.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			}))
			.filter((cat) => cat.blocks.length > 0)
	);

	function handlePaletteDragStart(e: DragEvent, block: BlockDef) {
		draggingFromPalette = block;
		e.dataTransfer!.effectAllowed = 'copy';
	}

	function handleCanvasDrop(e: DragEvent) {
		e.preventDefault();
		if (!draggingFromPalette) return;
		const cc = toCanvasCoords(e.clientX, e.clientY);
		const src = draggingFromPalette;
		canvasBlocks = [
			...canvasBlocks,
			{
				id: `block-${nextId++}`,
				typeId: src.id,
				name: src.name,
				color: src.color,
				icon: src.icon,
				x: snap(Math.max(0, cc.x - BLOCK_WIDTH / 2)),
				y: snap(Math.max(0, cc.y - BLOCK_HEADER / 2)),
				inputs: src.inputs.map((p) => ({ ...p })),
				outputs: src.outputs.map((p) => ({ ...p }))
			}
		];
		draggingFromPalette = null;
	}

	function handleBlockMouseDown(e: MouseEvent, block: CanvasBlock) {
		if ((e.target as HTMLElement).closest('.port-btn')) return;
		e.preventDefault();
		const cc = toCanvasCoords(e.clientX, e.clientY);
		draggingBlock = {
			id: block.id,
			offsetX: cc.x - block.x,
			offsetY: cc.y - block.y
		};
	}

	function handleCanvasMouseMove(e: MouseEvent) {
		if (isPanning) {
			panX += e.clientX - panStart.x;
			panY += e.clientY - panStart.y;
			panStart = { x: e.clientX, y: e.clientY };
			return;
		}
		const cc = toCanvasCoords(e.clientX, e.clientY);
		mousePos = cc;
		if (draggingBlock) {
			canvasBlocks = canvasBlocks.map((b) =>
				b.id === draggingBlock!.id
					? { ...b, x: snap(Math.max(0, cc.x - draggingBlock!.offsetX)), y: snap(Math.max(0, cc.y - draggingBlock!.offsetY)) }
					: b
			);
		}
	}

	function handleCanvasMouseDown(e: MouseEvent) {
		if (draggingBlock) return;
		const t = e.target as Element;
		if (t.closest('.port-btn')) return;
		if (t instanceof SVGPathElement || t instanceof SVGCircleElement) return;
		if (connectingFrom || draggingConnEnd) return;
		isPanning = true;
		panStart = { x: e.clientX, y: e.clientY };
		e.preventDefault();
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = canvas.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;
		const factor = e.deltaY < 0 ? 1.1 : 0.9;
		const newZoom = Math.max(0.15, Math.min(4, zoom * factor));
		panX = mx - (mx - panX) * (newZoom / zoom);
		panY = my - (my - panY) * (newZoom / zoom);
		zoom = newZoom;
	}

	function findPortAtPos(x: number, y: number, type: 'input' | 'output', excludeBlockId?: string) {
		for (const block of canvasBlocks) {
			if (block.id === excludeBlockId) continue;
			const ports = type === 'input' ? block.inputs : block.outputs;
			for (const port of ports) {
				const pos = getPortPos(block, port.id, type);
				const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
				if (dist <= PORT_R * 3) return { blockId: block.id, portId: port.id };
			}
		}
		return null;
	}

	function handleCanvasMouseUp() {
		if (isPanning) { isPanning = false; return; }
		if (draggingConnEnd) {
			const conn = connections.find((c) => c.id === draggingConnEnd!.connId);
			if (conn) {
				if (draggingConnEnd.end === 'to') {
					const hit = findPortAtPos(mousePos.x, mousePos.y, 'input', conn.fromBlockId);
					if (hit) {
						connections = connections.map((c) =>
							c.id === draggingConnEnd!.connId
								? { ...c, toBlockId: hit.blockId, toPortId: hit.portId }
								: c
						);
					}
				} else {
					const hit = findPortAtPos(mousePos.x, mousePos.y, 'output', conn.toBlockId);
					if (hit) {
						connections = connections.map((c) =>
							c.id === draggingConnEnd!.connId
								? { ...c, fromBlockId: hit.blockId, fromPortId: hit.portId }
								: c
						);
					}
				}
			}
			draggingConnEnd = null;
			return;
		}
		if (connectingFrom) {
			// ปล่อยเมาส์บนพื้นที่ว่าง — ยกเลิก
			const hit = findPortAtPos(mousePos.x, mousePos.y, 'input', connectingFrom.blockId);
			if (!hit) connectingFrom = null;
		}
		draggingBlock = null;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnId) {
			deleteConnection(selectedConnId);
			selectedConnId = null;
		}
		if (e.key === 'Escape') {
			selectedConnId = null;
			connectingFrom = null;
			draggingConnEnd = null;
		}
	}

	function handleOutputPortMouseDown(e: MouseEvent, blockId: string, portId: string) {
		e.stopPropagation();
		e.preventDefault();
		connectingFrom = { blockId, portId };
	}

	function handleInputPortMouseUp(e: MouseEvent, blockId: string, portId: string) {
		e.stopPropagation();
		if (!connectingFrom) return;
		if (connectingFrom.blockId === blockId) {
			connectingFrom = null;
			return;
		}
		// avoid duplicate
		const exists = connections.some(
			(c) =>
				c.fromBlockId === connectingFrom!.blockId &&
				c.fromPortId === connectingFrom!.portId &&
				c.toBlockId === blockId &&
				c.toPortId === portId
		);
		if (!exists) {
			connections = [
				...connections,
				{
					id: `conn-${nextId++}`,
					fromBlockId: connectingFrom.blockId,
					fromPortId: connectingFrom.portId,
					toBlockId: blockId,
					toPortId: portId
				}
			];
		}
		connectingFrom = null;
	}

	function handleCanvasClick() {
		connectingFrom = null;
		selectedConnId = null;
		showUserMenu = false;
	}

	function getPortPos(block: CanvasBlock, portId: string, side: 'input' | 'output') {
		const ports = side === 'input' ? block.inputs : block.outputs;
		const idx = ports.findIndex((p) => p.id === portId);
		const total = ports.length;
		const x = side === 'input' ? block.x : block.x + BLOCK_WIDTH;
		const y = portY(block, idx, total);
		return { x, y };
	}

	function bezier(x1: number, y1: number, x2: number, y2: number) {
		const dx = Math.abs(x2 - x1) * 0.5;
		return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
	}

	function connPath(conn: Connection) {
		const from = canvasBlocks.find((b) => b.id === conn.fromBlockId);
		const to = canvasBlocks.find((b) => b.id === conn.toBlockId);
		if (!from || !to) return '';
		const f = getPortPos(from, conn.fromPortId, 'output');
		const t = getPortPos(to, conn.toPortId, 'input');
		return bezier(f.x, f.y, t.x, t.y);
	}

	function tempConnPath() {
		if (!connectingFrom) return '';
		const from = canvasBlocks.find((b) => b.id === connectingFrom!.blockId);
		if (!from) return '';
		const f = getPortPos(from, connectingFrom.portId, 'output');
		return bezier(f.x, f.y, mousePos.x, mousePos.y);
	}

	function deleteBlock(blockId: string) {
		canvasBlocks = canvasBlocks.filter((b) => b.id !== blockId);
		connections = connections.filter(
			(c) => c.fromBlockId !== blockId && c.toBlockId !== blockId
		);
		if (connectingFrom?.blockId === blockId) connectingFrom = null;
	}

	function deleteConnection(connId: string) {
		connections = connections.filter((c) => c.id !== connId);
	}

	// ─── Flow → C Code Generator ────────────────────────────────────
	function flowToC(): string {
		const startBlock = canvasBlocks.find((b) => b.typeId === 'start');
		if (!startBlock) {
			return '// ไม่พบบล็อก Start\n// ลาก Start block มาวางใน Canvas ก่อน';
		}

		const lines: string[] = [
			'#include <stdio.h>',
			'#include <stdlib.h>',
			'#include <string.h>',
			'',
			'int main() {'
		];
		const visited = new Set<string>();
		const INDENT = '    ';
		const safeId = (id: string) => id.replace(/-/g, '_');

		function traverse(blockId: string, depth: number): void {
			if (visited.has(blockId)) return;
			visited.add(blockId);

			const block = canvasBlocks.find((b) => b.id === blockId);
			if (!block) return;

			const def = blockDefMap[block.typeId];
			if (!def) {
				lines.push(`${INDENT.repeat(depth)}/* unknown: ${block.name} */`);
				return;
			}

			let result;
			try {
				result = def.toCode({ block, depth, pad: INDENT.repeat(depth), safeId });
			} catch (err) {
				lines.push(`${INDENT.repeat(depth)}/* error: ${err instanceof Error ? err.message : String(err)} */`);
				return;
			}

			for (const part of result.parts) {
				if (Array.isArray(part)) {
					lines.push(...part);
				} else {
					const child = part as ChildRef;
					const conn = connections.find(
						(c) => c.fromBlockId === blockId && c.fromPortId === child.portId
					);
					if (conn) traverse(conn.toBlockId, depth + child.depthDelta);
				}
			}
		}

		traverse(startBlock.id, 1);
		lines.push('}');
		return lines.join('\n');
	}
	const cCode = $derived(flowToC());
	let showConsole = $state(true);

	$effect(() => {
		console.log('[FlowCode → C]\n' + cCode);
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
	<!-- ─── Top Navbar ──────────────────────────────────────────────── -->
	<header class="z-20 flex items-center justify-between border-b border-gray-700/60 bg-gray-900 px-4 py-2 shadow-lg">
		<!-- Brand + Toolbar -->
		<div class="flex items-center gap-1">
			<span class="mr-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-base font-bold text-transparent">
				FlowCode
			</span>

			<!-- Open Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="เปิดโปรเจค"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
				</svg>
				<span class="hidden sm:inline">เปิดโปรเจค</span>
			</button>

			<!-- Save Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="บันทึกโปรเจค"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
				</svg>
				<span class="hidden sm:inline">บันทึก</span>
			</button>

			<div class="mx-1 h-5 w-px bg-gray-700"></div>

			<!-- Run -->
			<button
				class="flex items-center gap-1.5 rounded bg-green-700 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-green-600"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>รัน</span>
			</button>

			<!-- Toggle C Code Console -->
			<button
				onclick={() => (showConsole = !showConsole)}
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors {showConsole ? 'bg-blue-700 text-white hover:bg-blue-600' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
				title="แสดง/ซ่อนโค้ด C"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
				<span class="hidden sm:inline">โค้ด C</span>
			</button>
		</div>

		<!-- User Avatar -->
		<div class="relative">
			<button
				onclick={(e) => { e.stopPropagation(); showUserMenu = !showUserMenu; }}
				class="h-8 w-8 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500"
				aria-label="เมนูผู้ใช้"
			>
				<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold">
					S
				</div>
			</button>

			{#if showUserMenu}
				<div class="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
					<!-- User info -->
					<div class="border-b border-gray-700 px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold">
								S
							</div>
							<div>
								<p class="text-sm font-semibold text-white">Sonthi</p>
								<p class="text-xs text-gray-400">sonthi@example.com</p>
							</div>
						</div>
					</div>

					<div class="py-1">
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
							<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							ข้อมูลส่วนตัว
						</button>
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
							<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
							โปรเจคของฉัน
						</button>
					</div>

					<div class="border-t border-gray-700 py-1">
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-gray-700/50 hover:text-red-300">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							ออกจากระบบ
						</button>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<!-- ─── Main ────────────────────────────────────────────────────── -->
	<div class="flex flex-1 overflow-hidden">
		<!-- ── Canvas ─────────────────────────────────────────────── -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			bind:this={canvas}
			class="relative flex-1 overflow-hidden"
			style="background-color:#0d1117; background-image: radial-gradient(circle, #1e293b 1px, transparent 1px); background-size: {GRID_SIZE * zoom}px {GRID_SIZE * zoom}px; background-position: {panX % (GRID_SIZE * zoom)}px {panY % (GRID_SIZE * zoom)}px; cursor: {isPanning ? 'grabbing' : 'grab'};"
			role="application"
			aria-label="Flow canvas"
			ondragover={(e) => e.preventDefault()}
			ondrop={handleCanvasDrop}
			onmousemove={handleCanvasMouseMove}
			onmousedown={handleCanvasMouseDown}
			onmouseup={handleCanvasMouseUp}
			onclick={handleCanvasClick}
			onwheel={handleWheel}
		>
			<!-- ── Transform wrapper (zoom + pan) ───────────────── -->
			<div style="position:absolute; width:100%; height:100%; transform:translate({panX}px,{panY}px) scale({zoom}); transform-origin:0 0;">

			<!-- SVG layer for connections -->
			<svg class="absolute inset-0 h-full w-full" style="pointer-events:none; overflow:visible;">
				<defs>
					<marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
						<polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
					</marker>
					<marker id="arrow-hover" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
						<polygon points="0 0, 8 3, 0 6" fill="#f87171" />
					</marker>
					<marker id="arrow-selected" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
					<polygon points="0 0, 8 3, 0 6" fill="#fbbf24" />
				</marker>
				<marker id="arrow-temp" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
						<polygon points="0 0, 8 3, 0 6" fill="#fbbf24" />
					</marker>
				</defs>

				<!-- Existing connections -->
				{#each connections as conn (conn.id)}
					{@const isSelected = selectedConnId === conn.id}
					{@const isDraggingThis = draggingConnEnd?.connId === conn.id}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<g
						style="pointer-events:stroke; cursor:pointer;"
						onclick={(e) => { e.stopPropagation(); selectedConnId = conn.id; }}
						role="button"
						aria-label="เลือกการเชื่อมต่อ"
						class="conn-group"
					>
						<!-- hit area -->
						<path d={connPath(conn)} fill="none" stroke="transparent" stroke-width="12" />
						<!-- visible line -->
						<path
							d={connPath(conn)}
							fill="none"
							stroke={isSelected ? '#fbbf24' : '#60a5fa'}
							stroke-width={isSelected ? 2.5 : 2}
							stroke-opacity={isDraggingThis ? 0.3 : 0.85}
							stroke-dasharray={isDraggingThis ? '6 3' : undefined}
							marker-end={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
							class="conn-line"
						/>
					</g>

					<!-- Handles for selected connection -->
					{#if isSelected && !draggingConnEnd}
						{@const fromBlock = canvasBlocks.find((b) => b.id === conn.fromBlockId)}
						{@const toBlock = canvasBlocks.find((b) => b.id === conn.toBlockId)}
						{#if fromBlock && toBlock}
							{@const fp = getPortPos(fromBlock, conn.fromPortId, 'output')}
							{@const tp = getPortPos(toBlock, conn.toPortId, 'input')}
							<!-- From handle -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<circle
								cx={fp.x} cy={fp.y} r={PORT_R + 3}
								fill="#fbbf24" stroke="#92400e" stroke-width="1.5"
								style="pointer-events:all; cursor:grab;"
								onmousedown={(e) => { e.stopPropagation(); e.preventDefault(); draggingConnEnd = { connId: conn.id, end: 'from' }; }}
							/>
							<!-- To handle -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<circle
								cx={tp.x} cy={tp.y} r={PORT_R + 3}
								fill="#fbbf24" stroke="#92400e" stroke-width="1.5"
								style="pointer-events:all; cursor:grab;"
								onmousedown={(e) => { e.stopPropagation(); e.preventDefault(); draggingConnEnd = { connId: conn.id, end: 'to' }; }}
							/>
						{/if}
					{/if}
				{/each}

				<!-- Temp line while dragging conn end -->
				{#if draggingConnEnd}
					{@const conn = connections.find((c) => c.id === draggingConnEnd!.connId)}
					{#if conn}
						{@const fromBlock = canvasBlocks.find((b) => b.id === conn.fromBlockId)}
						{@const toBlock = canvasBlocks.find((b) => b.id === conn.toBlockId)}
						{#if fromBlock && toBlock}
							{@const fp = getPortPos(fromBlock, conn.fromPortId, 'output')}
							{@const tp = getPortPos(toBlock, conn.toPortId, 'input')}
							<path
								d={draggingConnEnd.end === 'to'
									? bezier(fp.x, fp.y, mousePos.x, mousePos.y)
									: bezier(mousePos.x, mousePos.y, tp.x, tp.y)}
								fill="none"
								stroke="#fbbf24"
								stroke-width="2"
								stroke-dasharray="6 3"
								marker-end="url(#arrow-temp)"
							/>
						{/if}
					{/if}
				{/if}

				<!-- Temp connection while drawing new -->
				{#if connectingFrom}
					<path
						d={tempConnPath()}
						fill="none"
						stroke="#fbbf24"
						stroke-width="2"
						stroke-dasharray="6 3"
						marker-end="url(#arrow-temp)"
					/>
				{/if}
			</svg>

			<!-- Canvas blocks -->
			{#each canvasBlocks as block (block.id)}
				{@const bh = blockHeight(block)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute"
					style="left:{block.x}px; top:{block.y}px; width:{BLOCK_WIDTH}px; height:{bh}px;"
					onmousedown={(e) => handleBlockMouseDown(e, block)}
				>
					<!-- Block card -->
					<div
						class="absolute inset-0 select-none overflow-visible rounded-xl border shadow-xl"
						style="border-color:{block.color}55; background:linear-gradient(160deg,#1e293b,#0f172a); cursor:move;"
					>
						<!-- Colored top bar -->
						<div class="flex h-8 items-center justify-between rounded-t-xl px-2.5" style="background:{block.color}22; border-bottom:1px solid {block.color}40;">
							<div class="flex items-center gap-1.5 overflow-hidden">
								<span class="text-sm leading-none">{block.icon}</span>
								<span class="truncate text-[11px] font-semibold text-gray-200">{block.name}</span>
							</div>
							<button
								class="ml-1 flex-shrink-0 text-gray-600 transition-colors hover:text-red-400"
								onclick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
								aria-label="ลบบล็อก"
							>
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<!-- Port labels inside block -->
						<div class="flex h-[calc(100%-32px)] justify-between px-1 pt-1">
							<!-- Input labels -->
							<div class="flex flex-col gap-0 text-left">
								{#each block.inputs as port, i}
									<div
										class="flex items-center"
										style="height:{PORT_ROW_H}px;"
									>
										<span class="text-[9px] text-gray-500 pl-2">{port.label}</span>
									</div>
								{/each}
							</div>
							<!-- Output labels -->
							<div class="flex flex-col gap-0 text-right">
								{#each block.outputs as port, i}
									<div
										class="flex items-center justify-end"
										style="height:{PORT_ROW_H}px;"
									>
										<span class="text-[9px] text-gray-500 pr-2">{port.label}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Input ports — left edge -->
					{#each block.inputs as port, i}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="port-btn absolute flex items-center justify-center"
							style="left:{-PORT_R}px; top:{BLOCK_HEADER + PORT_ROW_H * i + PORT_ROW_H / 2 - PORT_R}px; width:{PORT_R * 2}px; height:{PORT_R * 2}px; z-index:10;"
							role="button"
							tabindex="0"
							aria-label="Input port {port.label}"
							onmouseup={(e) => handleInputPortMouseUp(e, block.id, port.id)}
						>
							<div
								class="h-full w-full rounded-full border-2 transition-all hover:scale-125"
								style="border-color:#60a5fa; background:{connectingFrom ? '#1e3a5f' : '#0d1117'};"
							></div>
						</div>
					{/each}

					<!-- Output ports — right edge -->
					{#each block.outputs as port, i}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="port-btn absolute flex items-center justify-center"
							style="right:{-PORT_R}px; top:{BLOCK_HEADER + PORT_ROW_H * i + PORT_ROW_H / 2 - PORT_R}px; width:{PORT_R * 2}px; height:{PORT_R * 2}px; z-index:10;"
							role="button"
							tabindex="0"
							aria-label="Output port {port.label}"
							onmousedown={(e) => handleOutputPortMouseDown(e, block.id, port.id)}
						>
							<div
								class="h-full w-full rounded-full border-2 transition-all hover:scale-125"
								style="border-color:#4ade80; background:{connectingFrom?.blockId === block.id && connectingFrom?.portId === port.id ? '#14532d' : '#0d1117'};"
							></div>
						</div>
					{/each}
				</div>
			{/each}

			</div><!-- end transform wrapper -->

			<!-- Empty canvas hint -->
			{#if canvasBlocks.length === 0}
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div class="text-center">
						<svg class="mx-auto mb-4 h-20 w-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
								d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
						</svg>
						<p class="text-base font-medium text-gray-600">ลากบล็อกจากแผงด้านขวามาวางที่นี่</p>
						<p class="mt-1 text-xs text-gray-700">เชื่อมต่อบล็อกด้วยการคลิกที่พอร์ตสีเขียว แล้วคลิกพอร์ตสีน้ำเงิน</p>
					</div>
				</div>
			{/if}

			<!-- Connecting hint -->
			{#if connectingFrom}
				<div class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500/20 border border-yellow-500/40 px-4 py-1.5">
					<p class="text-xs text-yellow-300">คลิกที่พอร์ต Input (สีน้ำเงิน) เพื่อเชื่อมต่อ — คลิกพื้นที่ว่างเพื่อยกเลิก</p>
				</div>
			{/if}
		</div>

		<!-- ── Right Panel: Block Palette ─────────────────────────── -->
		<aside class="flex w-60 flex-col border-l border-gray-700/60 bg-gray-900">
			<div class="border-b border-gray-700/60 px-3 py-3">
				<h2 class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">บล็อก</h2>
				<div class="relative">
					<svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						placeholder="ค้นหา..."
						bind:value={searchQuery}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 py-1.5 pl-8 pr-3 text-xs text-gray-300 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
					/>
				</div>
			</div>

			<div class="flex-1 space-y-4 overflow-y-auto p-3">
				{#each filteredCategories as category}
					<div>
						<h3 class="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-600">
							{category.name}
						</h3>
						<div class="space-y-1">
							{#each category.blocks as block}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									draggable="true"
									ondragstart={(e) => handlePaletteDragStart(e, block)}
									class="flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all active:cursor-grabbing active:scale-95 hover:brightness-110"
									style="border-color:{block.color}30; background:linear-gradient(135deg,{block.color}12,{block.color}06);"
									role="button"
									tabindex="0"
									aria-label="บล็อก {block.name}"
								>
									<div
										class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold"
										style="background:{block.color}25; color:{block.color};"
									>
										{block.icon}
									</div>
									<div class="min-w-0">
										<p class="truncate text-[11px] font-medium text-gray-300">{block.name}</p>
										<p class="text-[9px] text-gray-600">
											{block.inputs.length} in · {block.outputs.length} out
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				{#if filteredCategories.length === 0}
					<p class="mt-4 text-center text-xs text-gray-600">ไม่พบบล็อกที่ค้นหา</p>
				{/if}
			</div>
		</aside>
	</div>

	<!-- ─── C Code Console ──────────────────────────────────────────── -->
	{#if showConsole}
		<div class="flex h-52 flex-col border-t border-gray-700/60 bg-gray-950">
			<!-- Console header -->
			<div class="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-1.5">
				<div class="flex items-center gap-2">
					<svg class="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
					<span class="text-[11px] font-semibold text-gray-400">C Code Output</span>
					<span class="rounded bg-blue-900/50 px-1.5 py-0.5 text-[9px] text-blue-400">live</span>
				</div>
				<button
					onclick={() => navigator.clipboard.writeText(cCode)}
					class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
					title="คัดลอกโค้ด"
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					คัดลอก
				</button>
			</div>
			<!-- Code display -->
			<pre class="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-green-300">{cCode}</pre>
		</div>
	{/if}

	<!-- ─── Status bar ──────────────────────────────────────────────── -->
	<footer class="flex items-center gap-4 border-t border-gray-800 bg-gray-900 px-4 py-1 text-[10px] text-gray-600">
		<span>บล็อก: <span class="text-gray-400">{canvasBlocks.length}</span></span>
		<span>การเชื่อมต่อ: <span class="text-gray-400">{connections.length}</span></span>
		<span class="ml-auto flex items-center gap-2">
			<button onclick={() => { zoom = Math.min(4, zoom * 1.2); }} class="rounded px-1.5 py-0.5 hover:bg-gray-700 hover:text-gray-300 transition-colors">+</button>
			<button onclick={() => { zoom = 1; panX = 0; panY = 0; }} class="rounded px-1.5 py-0.5 hover:bg-gray-700 hover:text-gray-300 transition-colors text-gray-500">
				{Math.round(zoom * 100)}%
			</button>
			<button onclick={() => { zoom = Math.max(0.15, zoom * 0.8); }} class="rounded px-1.5 py-0.5 hover:bg-gray-700 hover:text-gray-300 transition-colors">−</button>
		</span>
		{#if connectingFrom}
			<span class="text-yellow-500">กำลังเชื่อมต่อ...</span>
		{/if}
		{#if selectedConnId}
			<span class="text-yellow-400">เส้นถูกเลือก — กด <kbd class="rounded bg-gray-700 px-1 font-mono">Delete</kbd> เพื่อลบ หรือลากจุดสีเหลืองเพื่อย้าย</span>
		{/if}
	</footer>
</div>

<style>
	.conn-group:hover .conn-line {
		stroke: #f87171;
		marker-end: url(#arrow-hover);
	}
</style>
