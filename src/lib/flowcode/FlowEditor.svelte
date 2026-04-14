<script lang="ts">
	import {
		isCompatible,
		PORT_TYPE_COLORS,
		paramDefault
	} from '$lib/blocks/types.js';
	import type {
		CanvasBlock,
		Connection,
		BlockDef,
		BlockCategory,
		DataType,
		ParamVarname,
		ParamColor
	} from '$lib/blocks/types.js';
	import { flowToC } from './engine.js';
	import BlockContextMenu from '$lib/components/BlockContextMenu.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';

	interface Props {
		/** หมวดหมู่บล็อกที่แสดงในแผง Palette (default: ทุก category) */
		categories?: BlockCategory[];
		/** เรียกทุกครั้งที่ state เปลี่ยน */
		onchange?: (event: FlowEditorEvent) => void;
		onhelp?: (blockInfo: BlockDef) => void;
	}

	export type FlowEditorEvent =
		| 'block:add'
		| 'block:move'
		| 'block:delete'
		| 'block:param'
		| 'block:focus'
		| 'block:blur'
		| 'block:note-edit'
		| 'conn:add'
		| 'conn:delete'
		| 'conn:focus'
		| 'conn:blur'
		| 'project:load'
		| 'project:clear'
		| 'zoom';

	let { categories = [], onchange, onhelp }: Props = $props();

	/** map จาก typeId → BlockDef ที่ใช้งานอยู่ */
	const defMap = $derived<Record<string, BlockDef>>(
		Object.fromEntries(categories.flatMap((c) => c.blocks).map((b) => [b.id, b]))
	);

	// ─── Canvas state ───────────────────────────────────────────────
	let canvasBlocks = $state<CanvasBlock[]>([]);
	let connections = $state<Connection[]>([]);

	// ─── Varname registry ────────────────────────────────────────────
	// category → string[] เช่น { http: ['http', 'http2'], tcp: ['client'] }
	let varnameRegistry = $state<Record<string, string[]>>({
		http:      ['http'],
		tcp:       ['tcpClient'],
		udp:       ['udp'],
		file:      ['myFile'],
		webserver: ['server'],
		mqtt:      ['mqttClient'],
		json:      ['doc'],
		modbus:    ['modbus'],
		var_int:       ['myInt'],
		var_float:     ['myFloat'],
		var_string:    ['myString'],
		var_bool:      ['myBool'],
		influxdb:      ['influxClient'],
		influxdb_point:['sensorPoint'],
	});

	function getVarnameOptions(category: string) {
		const names = varnameRegistry[category] ?? [];
		return [
			...names.map((n) => ({ label: n, value: n })),
			{ label: '+ New...', value: '__new__' },
		];
	}

	function handleVarnameChange(blockId: string, paramId: string, category: string, value: string) {
		if (value !== '__new__') {
			updateBlockParam(blockId, paramId, value);
			return;
		}
		// prompt for new varname
		const name = window.prompt(`ชื่อตัวแปรใหม่ (${category}):`);
		if (!name || !name.trim()) return;
		const trimmed = name.trim().replace(/[^a-zA-Z0-9_]/g, '_');
		if (!varnameRegistry[category]) varnameRegistry[category] = [];
		if (!varnameRegistry[category].includes(trimmed)) {
			varnameRegistry[category] = [...varnameRegistry[category], trimmed];
		}
		updateBlockParam(blockId, paramId, trimmed);
	}
	let nextId = 1;

	let draggingFromPalette = $state<BlockDef | null>(null);
	let paletteGhost = $state<{ x: number; y: number } | null>(null);
	let draggingBlock = $state<{ id: string; offsetX: number; offsetY: number } | null>(null);

	let connectingFrom = $state<{ blockId: string; portId: string } | null>(null);
	let mousePos = $state({ x: 0, y: 0 });
	let selectedConnId = $state<string | null>(null);
	let selectedBlockId = $state<string | null>(null);
	let selectedBlockIds = $state<Set<string>>(new Set());
	let selectedConnIds = $state<Set<string>>(new Set());
	let multiDragOffsets = $state<Map<string, { ox: number; oy: number }> | null>(null);
	let draggingConnEnd = $state<{ connId: string; end: 'from' | 'to' } | null>(null);
	let searchQuery = $state('');
	let contextMenu = $state<{ x: number; y: number; blockId: string } | null>(null);

	const connectingDataType = $derived<DataType | null>(
		connectingFrom
			? (canvasBlocks
					.find((b) => b.id === connectingFrom?.blockId)
					?.outputs.find((p) => p.id === connectingFrom?.portId)?.dataType ?? 'any')
			: null
	);

	// ─── Viewport state ─────────────────────────────────────────────
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStart = { x: 0, y: 0 };
	let didPan = false; // true เมื่อขยับเมาส์ขณะ pan (ไม่ใช่แค่คลิก)

	let canvas: HTMLElement;

	// ─── Layout constants ────────────────────────────────────────────
	const BLOCK_WIDTH = 130;
	const BLOCK_HEADER = 36;
	const PORT_ROW_H = 18;
	const PORT_R = 6;
	const GRID_SIZE = 20;
	const PARAM_INPUT_H = 30;
	const PARAM_LABEL_H = 12;
	const PARAM_GAP = 4;

	const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

	function toCanvasCoords(clientX: number, clientY: number) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (clientX - rect.left - panX) / zoom,
			y: (clientY - rect.top - panY) / zoom
		};
	}

	function blockParamH(block: CanvasBlock) {
		const def = defMap[block.typeId];
		const params = def?.params;
		if (!params || params.length === 0) return 0;
		let h = 8;
		for (let i = 0; i < params.length; i++) {
			// Check hidden
			const defHidden = params[i].hidden;
			if (typeof defHidden === "function" ? defHidden({ params: block.params }) : typeof defHidden === "boolean" ? defHidden : false) continue;
			
			if (i > 0) h += PARAM_GAP;
			if (params[i].label) { h += PARAM_LABEL_H; h += PARAM_GAP; }
			h += PARAM_INPUT_H;
		}
		h += 4;
		return h;
	}

	function blockPortH(block: CanvasBlock) {
		return Math.max(block.inputs.length, block.outputs.length) * PORT_ROW_H + 9;
	}

	function blockHeight(block: CanvasBlock) {
		return BLOCK_HEADER + blockPortH(block) + blockParamH(block);
	}

	function portY(block: CanvasBlock, index: number) {
		return block.y + BLOCK_HEADER + PORT_ROW_H * index + PORT_ROW_H / 2;
	}

	// ─── Filtered palette ────────────────────────────────────────────
	const filteredCategories = $derived(
		categories
			.map((cat) => ({
				...cat,
				blocks: cat.blocks.filter((b) =>
					b.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			}))
			.filter((cat) => cat.blocks.length > 0)
	);

	// ─── Palette drag ────────────────────────────────────────────────
	function handlePaletteMouseDown(e: MouseEvent, block: BlockDef) {
		e.preventDefault();
		draggingFromPalette = block;
		paletteGhost = { x: e.clientX, y: e.clientY };
	}

	function dropPaletteBlock(clientX: number, clientY: number) {
		if (!draggingFromPalette) return;
		const rect = canvas.getBoundingClientRect();
		if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
			draggingFromPalette = null;
			paletteGhost = null;
			return;
		}
		const cc = toCanvasCoords(clientX, clientY);
		const src = draggingFromPalette;
		const defaultParams = Object.fromEntries((src.params ?? []).map((p) => [p.id, paramDefault(p)]));
		const dynPorts = src.dynamicPorts?.(defaultParams);
		canvasBlocks = [
			...canvasBlocks,
			{
				id: `block-${nextId++}`,
				typeId: src.id,
				trigger: src?.trigger || false,
				name: src.name,
				color: src.color,
				icon: src.icon,
				x: snap(Math.max(0, cc.x - BLOCK_WIDTH / 2)),
				y: snap(Math.max(0, cc.y - BLOCK_HEADER / 2)),
				inputs:  (dynPorts?.inputs  ?? src.inputs).map((p) => ({ ...p })),
				outputs: (dynPorts?.outputs ?? src.outputs).map((p) => ({ ...p })),
				params: defaultParams,
				note: ''
			}
		];
		draggingFromPalette = null;
		paletteGhost = null;
		onchange?.('block:add');
	}

	// ─── Block drag ──────────────────────────────────────────────────
	function handleBlockMouseDown(e: MouseEvent, block: CanvasBlock) {
		if ((e.target as HTMLElement).closest('.port-btn')) return;
		e.preventDefault();
		e.stopPropagation();
		(document.activeElement as HTMLElement)?.blur();

		const cc = toCanvasCoords(e.clientX, e.clientY);

		if (e.shiftKey) {
			// Shift+Click: toggle block in multi-select
			const newSet = new Set(selectedBlockIds);
			if (selectedBlockId && selectedBlockId !== block.id) newSet.add(selectedBlockId);

			const wasSelected = newSet.has(block.id) || selectedBlockId === block.id;
			if (wasSelected) {
				// Deselect: remove from set, move focus to another remaining block or clear
				newSet.delete(block.id);
				const remaining = [...newSet];
				selectedBlockId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
				selectedBlockIds = newSet;
				selectedConnId = null;
				selectedConnIds = new Set();
				onchange?.(selectedBlockId ? 'block:focus' : 'block:blur');
				multiDragOffsets = null;
				draggingBlock = null;
			} else {
				// Select: add to set, set as focused
				newSet.add(block.id);
				selectedBlockIds = newSet;
				selectedBlockId = block.id;
				selectedConnId = null;
				selectedConnIds = new Set();
				onchange?.('block:focus');
				const offsets = new Map<string, { ox: number; oy: number }>();
				for (const b of canvasBlocks) {
					if (newSet.has(b.id)) offsets.set(b.id, { ox: cc.x - b.x, oy: cc.y - b.y });
				}
				multiDragOffsets = offsets;
				draggingBlock = { id: block.id, offsetX: cc.x - block.x, offsetY: cc.y - block.y };
			}
			return;
		}

		// Regular click: if block is NOT in multi-select, clear multi-select
		if (!selectedBlockIds.has(block.id)) {
			selectedBlockIds = new Set();
			selectedConnIds = new Set();
		}
		selectedBlockId = block.id;
		selectedConnId = null;
		onchange?.('block:focus');

		// Setup drag (multi or single)
		const allSelected = selectedBlockIds.size > 0 ? selectedBlockIds : new Set([block.id]);
		const offsets = new Map<string, { ox: number; oy: number }>();
		for (const b of canvasBlocks) {
			if (allSelected.has(b.id)) offsets.set(b.id, { ox: cc.x - b.x, oy: cc.y - b.y });
		}
		multiDragOffsets = offsets;
		draggingBlock = { id: block.id, offsetX: cc.x - block.x, offsetY: cc.y - block.y };
	}

	// ─── Window-level pointer events (palette ghost + block drag) ────
	function handleWindowMouseMove(e: MouseEvent) {
		if (paletteGhost) paletteGhost = { x: e.clientX, y: e.clientY };
	}

	function handleWindowMouseUp(e: MouseEvent) {
		if (draggingFromPalette) dropPaletteBlock(e.clientX, e.clientY);
	}

	// ─── Canvas mouse events ─────────────────────────────────────────
	function handleCanvasMouseMove(e: MouseEvent) {
		if (isPanning) {
			didPan = true;
			panX += e.clientX - panStart.x;
			panY += e.clientY - panStart.y;
			panStart = { x: e.clientX, y: e.clientY };
			return;
		}
		const cc = toCanvasCoords(e.clientX, e.clientY);
		mousePos = cc;
		if (draggingBlock) {
			if (multiDragOffsets && multiDragOffsets.size > 1) {
				canvasBlocks = canvasBlocks.map((b) => {
					const off = multiDragOffsets!.get(b.id);
					if (!off) return b;
					return { ...b, x: snap(cc.x - off.ox), y: snap(cc.y - off.oy) };
				});
			} else {
				canvasBlocks = canvasBlocks.map((b) =>
					b.id === draggingBlock!.id
						? {
								...b,
								x: snap(cc.x - draggingBlock!.offsetX),
								y: snap(cc.y - draggingBlock!.offsetY)
							}
						: b
				);
			}
			onchange?.('block:move');
		}
	}

	function handleCanvasMouseDown(e: MouseEvent) {
		if (draggingBlock) return;
		const t = e.target as Element;
		if (t.closest('.port-btn')) return;
		if (t instanceof SVGPathElement || t instanceof SVGCircleElement) return;
		if (connectingFrom || draggingConnEnd) return;
		isPanning = true;
		didPan = false;
		panStart = { x: e.clientX, y: e.clientY };
		e.preventDefault();
	}

	function handleCanvasMouseUp() {
		if (isPanning) { isPanning = false; return; }
		if (draggingConnEnd) {
			const conn = connections.find((c) => c.id === draggingConnEnd!.connId);
			if (conn) {
				if (draggingConnEnd.end === 'to') {
					const hit = findPortAtPos(mousePos.x, mousePos.y, 'input', conn.fromBlockId);
					const _fp = canvasBlocks.find((b) => b.id === conn.fromBlockId)?.outputs.find((p) => p.id === conn.fromPortId);
					const _tp = hit && canvasBlocks.find((b) => b.id === hit.blockId)?.inputs.find((p) => p.id === hit.portId);
					if (hit && (!_fp || !_tp || isCompatible(_fp.dataType, _tp.dataType))) {
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
			const hit = findPortAtPos(mousePos.x, mousePos.y, 'input', connectingFrom.blockId);
			if (!hit) connectingFrom = null;
		}
		draggingBlock = null;
		multiDragOffsets = null;
	}

	function handleCanvasClick() {
		// ถ้าเพิ่งเลื่อน canvas (pan) ให้ข้ามการ deselect
		if (didPan) { didPan = false; return; }
		connectingFrom = null;
		const hadBlock = selectedBlockId !== null || selectedBlockIds.size > 0;
		const hadConn = selectedConnId !== null || selectedConnIds.size > 0;
		selectedConnId = null;
		selectedBlockId = null;
		selectedBlockIds = new Set();
		selectedConnIds = new Set();
		(document.activeElement as HTMLElement)?.blur();
		if (hadBlock) onchange?.('block:blur');
		else if (hadConn) onchange?.('conn:blur');
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
		onchange?.('zoom');
	}

	function zoomAround(factor: number) {
		const rect = canvas.getBoundingClientRect();
		const cx = rect.width / 2;
		const cy = rect.height / 2;
		const newZoom = Math.max(0.15, Math.min(4, zoom * factor));
		panX = cx - (cx - panX) * (newZoom / zoom);
		panY = cy - (cy - panY) * (newZoom / zoom);
		zoom = newZoom;
		onchange?.('zoom');
	}

	function focusCanvas() {
		if (canvasBlocks.length === 0) { zoom = 1; panX = 0; panY = 0; return; }
		const rect = canvas.getBoundingClientRect();
		const pad = 60;
		const minX = Math.min(...canvasBlocks.map((b) => b.x));
		const minY = Math.min(...canvasBlocks.map((b) => b.y));
		const maxX = Math.max(...canvasBlocks.map((b) => b.x + BLOCK_WIDTH));
		const maxY = Math.max(...canvasBlocks.map((b) => b.y + blockHeight(b)));
		const bw = maxX - minX || 1;
		const bh = maxY - minY || 1;
		const newZoom = Math.min(4, Math.max(0.15, Math.min((rect.width - pad * 2) / bw, (rect.height - pad * 2) / bh)));
		panX = (rect.width - bw * newZoom) / 2 - minX * newZoom;
		panY = (rect.height - bh * newZoom) / 2 - minY * newZoom;
		zoom = newZoom;
		onchange?.('zoom');
	}

	// ─── Keyboard ────────────────────────────────────────────────────
	function handleKeyDown(e: KeyboardEvent) {
		const active = document.activeElement;
		const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
		if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
			if (selectedBlockIds.size > 0) {
				const toDelete = new Set([...selectedBlockIds, ...(selectedBlockId ? [selectedBlockId] : [])]);
				for (const id of toDelete) deleteBlock(id);
				selectedBlockIds = new Set();
				selectedBlockId = null;
			} else if (selectedConnIds.size > 0) {
				for (const id of selectedConnIds) deleteConnection(id);
				selectedConnIds = new Set();
				selectedConnId = null;
			} else if (selectedBlockId) {
				deleteBlock(selectedBlockId);
				selectedBlockId = null;
			} else if (selectedConnId) {
				deleteConnection(selectedConnId);
				selectedConnId = null;
			}
		}
		if (e.ctrlKey && e.key === 'a' && !isInput) {
			e.preventDefault();
			selectedBlockIds = new Set(canvasBlocks.map((b) => b.id));
			selectedConnIds = new Set(connections.map((c) => c.id));
			selectedBlockId = null;
			selectedConnId = null;
		}
		if (e.key === 'Escape') {
			const hadBlock = selectedBlockId !== null || selectedBlockIds.size > 0;
			const hadConn = selectedConnId !== null || selectedConnIds.size > 0;
			selectedBlockId = null;
			selectedBlockIds = new Set();
			selectedConnId = null;
			selectedConnIds = new Set();
			connectingFrom = null;
			draggingConnEnd = null;
			if (hadBlock) onchange?.('block:blur');
			else if (hadConn) onchange?.('conn:blur');
		}
	}

	// ─── Select All (public API) ─────────────────────────────────────
	export function selectAll() {
		selectedBlockIds = new Set(canvasBlocks.map((b) => b.id));
		selectedConnIds = new Set(connections.map((c) => c.id));
		selectedBlockId = null;
		selectedConnId = null;
	}

	// ─── Public keyboard handler (เรียกจาก parent) ───────────────────
	export function handleExternalKeyDown(e: KeyboardEvent) {
		handleKeyDown(e);
	}

	// ─── Port interaction ────────────────────────────────────────────
	function handleOutputPortMouseDown(e: MouseEvent, blockId: string, portId: string) {
		e.stopPropagation();
		e.preventDefault();
		connectingFrom = { blockId, portId };
	}

	function handleInputPortMouseUp(e: MouseEvent, blockId: string, portId: string) {
		e.stopPropagation();
		if (!connectingFrom) return;
		const _fromPort = canvasBlocks
			.find((b) => b.id === connectingFrom!.blockId)
			?.outputs.find((p) => p.id === connectingFrom!.portId);
		const _toPort = canvasBlocks.find((b) => b.id === blockId)?.inputs.find((p) => p.id === portId);
		if (_fromPort && _toPort && !isCompatible(_fromPort.dataType, _toPort.dataType)) {
			connectingFrom = null;
			return;
		}
		if (connectingFrom.blockId === blockId) { connectingFrom = null; return; }
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
			onchange?.('conn:add');
		}
		connectingFrom = null;
	}

	// ─── Block / connection helpers ──────────────────────────────────
	export function duplicateBlock(blockId: string) {
		const block = canvasBlocks.find((b) => b.id === blockId);
		if (!block) return;
		canvasBlocks = [...canvasBlocks, {
			...block,
			id: `block-${nextId++}`,
			x: block.x + 20,
			y: block.y + 20,
			inputs: block.inputs.map((p) => ({ ...p })),
			outputs: block.outputs.map((p) => ({ ...p })),
			params: { ...block.params },
		}];
		onchange?.('block:add');
	}

	export function deleteBlock(blockId: string) {
		canvasBlocks = canvasBlocks.filter((b) => b.id !== blockId);
		connections = connections.filter(
			(c) => c.fromBlockId !== blockId && c.toBlockId !== blockId
		);
		if (connectingFrom?.blockId === blockId) connectingFrom = null;
		onchange?.('block:delete');
	}

	export function deleteConnection(connId: string) {
		connections = connections.filter((c) => c.id !== connId);
		onchange?.('conn:delete');
	}

	// ─── Color param helpers ─────────────────────────────────────────────────

	/** Parse a color param value string (decimal or 0x/0X hex) to a number */
	function parseColorValue(value: string): number {
		const s = value.trim();
		if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s.slice(2), 16) || 0;
		return parseInt(s) || 0;
	}

	/** Convert stored color param value → #RRGGBB for <input type="color"> */
	function colorParamToHex(value: string, format: 'rgb565' | 'rgb8'): string {
		const n = parseColorValue(value);
		if (format === 'rgb565') {
			const r = ((n >> 11) & 0x1F) << 3;
			const g = ((n >> 5)  & 0x3F) << 2;
			const b =  (n        & 0x1F) << 3;
			return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
		} else {
			return `#${(n & 0xFFFFFF).toString(16).padStart(6,'0')}`;
		}
	}

	/** Convert #RRGGBB from <input type="color"> → stored color param value */
	function hexToColorParam(hex: string, format: 'rgb565' | 'rgb8'): string {
		const r = parseInt(hex.slice(1, 3), 16) || 0;
		const g = parseInt(hex.slice(3, 5), 16) || 0;
		const b = parseInt(hex.slice(5, 7), 16) || 0;
		if (format === 'rgb565') {
			const r5 = (r >> 3) & 0x1F;
			const g6 = (g >> 2) & 0x3F;
			const b5 = (b >> 3) & 0x1F;
			const v   = (r5 << 11) | (g6 << 5) | b5;
			return `0x${v.toString(16).toUpperCase().padStart(4, '0')}`;
		} else {
			return `0x${r.toString(16).padStart(2,'0').toUpperCase()}${g.toString(16).padStart(2,'0').toUpperCase()}${b.toString(16).padStart(2,'0').toUpperCase()}`;
		}
	}

	function updateBlockParam(blockId: string, paramId: string, raw: string) {
		const def = defMap[canvasBlocks.find((b) => b.id === blockId)?.typeId ?? ''];
		const pDef = def?.params?.find((p) => p.id === paramId);
		let value = raw;
		if (pDef?.type === 'number' && pDef.validation) {
			const n = parseFloat(raw);
			if (!isNaN(n)) value = String(pDef.validation(n));
		} else if (pDef?.type === 'text' && pDef.validation) {
			value = pDef.validation(raw);
		}

		canvasBlocks = canvasBlocks.map((b) => {
			if (b.id !== blockId) return b;
			const newParams = { ...(b.params ?? {}), [paramId]: value };
			if (!def?.dynamicPorts) return { ...b, params: newParams };
			const dyn = def.dynamicPorts(newParams);
			return {
				...b,
				params: newParams,
				inputs:  dyn.inputs  ? dyn.inputs.map((p) => ({ ...p }))  : b.inputs,
				outputs: dyn.outputs ? dyn.outputs.map((p) => ({ ...p })) : b.outputs,
			};
		});

		// Remove connections whose port no longer exists on this block
		if (def?.dynamicPorts) {
			const block = canvasBlocks.find((b) => b.id === blockId);
			if (block) {
				const inIds  = new Set(block.inputs.map((p) => p.id));
				const outIds = new Set(block.outputs.map((p) => p.id));
				connections = connections.filter((c) => {
					if (c.toBlockId   === blockId && !inIds.has(c.toPortId))   return false;
					if (c.fromBlockId === blockId && !outIds.has(c.fromPortId)) return false;
					return true;
				});
			}
		}

		onchange?.('block:param');
	}

	// ─── Port position helpers ───────────────────────────────────────
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

	function getPortPos(block: CanvasBlock, portId: string, side: 'input' | 'output') {
		const ports = side === 'input' ? block.inputs : block.outputs;
		const idx = ports.findIndex((p) => p.id === portId);
		const x = side === 'input' ? block.x : block.x + BLOCK_WIDTH;
		const y = portY(block, idx);
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

	function editNote(blockId: string) {
		let b = canvasBlocks.find((b) => b.id === blockId);
		if (!b) return; // not found block id
		const newNote = prompt('ข้อความที่ต้องการโน็ต', b.note);
		if (newNote == null) return; // Cancel
		b.note = newNote;
		onchange?.('block:note-edit');
	}

	// ─── Public API (via bind:this) ──────────────────────────────────
	export function blockList() {
		return canvasBlocks;
	}

	export function connectionList() {
		return connections;
	}

	export function getZoom() { return zoom; }
	export function getIsConnecting() { return connectingFrom !== null; }
	export function getSelectedBlock() { return canvasBlocks.find((b) => b.id === selectedBlockId) ?? null; }
	export function getSelectedConn() { return selectedConnId !== null; }

	export function exportJson() {
		return JSON.stringify({ canvasBlocks, connections, varnameRegistry }, null, 2);
	}

	export function importJson(text: string) {
		try {
			const data = JSON.parse(text);
			if (Array.isArray(data.canvasBlocks) && Array.isArray(data.connections)) {
				canvasBlocks = data.canvasBlocks;
				connections = data.connections;
				if (data.varnameRegistry && typeof data.varnameRegistry === 'object') {
					varnameRegistry = data.varnameRegistry;
				}
				const ids = canvasBlocks.map((b) => parseInt(b.id.replace('block-', '')) || 0);
				const connIds = connections.map((c) => parseInt(c.id.replace('conn-', '')) || 0);
				nextId = Math.max(0, ...ids, ...connIds) + 1;
				onchange?.('project:load');
			}
		} catch {
			console.error('ไม่สามารถโหลดไฟล์โปรเจคได้');
		}
	}

	export function clear() {
		canvasBlocks = [];
		connections = [];
		selectedBlockId = null;
		selectedConnId = null;
		zoom = 1;
		panX = 0;
		panY = 0;
		onchange?.('project:clear');
	}

	export function zoomReset() {
		zoom = 1;
		panX = 0;
		panY = 0;
		onchange?.('zoom');
	}

	// ─── Code generation ─────────────────────────────────────────────
	export function generateCode() {
		return flowToC(canvasBlocks, connections, defMap);
	}
</script>

<svelte:window
	onmousemove={handleWindowMouseMove}
	onmouseup={handleWindowMouseUp}
/>

<!-- ─── Canvas + Palette ──────────────────────────────────────────── -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-1 overflow-hidden">
	<!-- ── Canvas ────────────────────────────────────────────────── -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={canvas}
		class="relative flex-1 overflow-hidden"
		style="background-color:#0d1117; background-image: radial-gradient(circle, #1e293b 1px, transparent 1px); background-size: {GRID_SIZE * zoom}px {GRID_SIZE * zoom}px; background-position: {panX % (GRID_SIZE * zoom)}px {panY % (GRID_SIZE * zoom)}px; cursor: {isPanning ? 'grabbing' : 'grab'};"
		role="application"
		tabindex="-1"
		aria-label="Flow canvas"
		onmousemove={handleCanvasMouseMove}
		onmousedown={handleCanvasMouseDown}
		onmouseup={handleCanvasMouseUp}
		onclick={handleCanvasClick}
		onwheel={handleWheel}
	>
		<!-- Transform wrapper (zoom + pan) -->
		<div style="position:absolute; width:100%; height:100%; transform:translate({panX}px,{panY}px) scale({zoom}); transform-origin:0 0;">

			<!-- SVG layer for connections -->
			<svg class="absolute inset-0 h-full w-full" style="pointer-events:none; overflow:visible;">
				<defs>
					<marker id="arrow" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto" markerUnits="userSpaceOnUse">
						<polygon points="0 0, 14 5, 0 10" fill="#60a5fa" />
					</marker>
					<marker id="arrow-hover" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto" markerUnits="userSpaceOnUse">
						<polygon points="0 0, 14 5, 0 10" fill="#f87171" />
					</marker>
					<marker id="arrow-selected" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto" markerUnits="userSpaceOnUse">
						<polygon points="0 0, 14 5, 0 10" fill="#fbbf24" />
					</marker>
					<marker id="arrow-temp" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto" markerUnits="userSpaceOnUse">
						<polygon points="0 0, 14 5, 0 10" fill="#fbbf24" />
					</marker>
				</defs>

				<!-- Existing connections -->
				{#each connections as conn (conn.id)}
					{@const isSelected = selectedConnId === conn.id || selectedConnIds.has(conn.id)}
					{@const isDraggingThis = draggingConnEnd?.connId === conn.id}
					<g
						style="pointer-events:stroke; cursor:pointer;"
						onclick={(e) => { e.stopPropagation(); if (e.shiftKey) { const ns = new Set(selectedConnIds); ns.has(conn.id) ? ns.delete(conn.id) : ns.add(conn.id); selectedConnIds = ns; onchange?.('conn:focus'); } else { selectedConnIds = new Set(); if (selectedBlockId) { selectedBlockId = null; selectedBlockIds = new Set(); onchange?.('block:blur'); } selectedConnId = conn.id; onchange?.('conn:focus'); } }}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (selectedBlockId) { selectedBlockId = null; onchange?.('block:blur'); } selectedConnId = conn.id; onchange?.('conn:focus'); } }}
						role="button"
						tabindex="0"
						aria-label="เลือกการเชื่อมต่อ"
						class="conn-group"
					>
						<path d={connPath(conn)} fill="none" stroke="transparent" stroke-width="12" />
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
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<circle
								cx={fp.x} cy={fp.y} r={PORT_R + 3}
								fill="#fbbf24" stroke="#92400e" stroke-width="1.5"
								style="pointer-events:all; cursor:grab;"
								onmousedown={(e) => { e.stopPropagation(); e.preventDefault(); draggingConnEnd = { connId: conn.id, end: 'from' }; }}
							/>
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
								fill="none" stroke="#fbbf24" stroke-width="2"
								stroke-dasharray="6 3" marker-end="url(#arrow-temp)"
							/>
						{/if}
					{/if}
				{/if}

				<!-- Temp connection while drawing new -->
				{#if connectingFrom}
					<path
						d={tempConnPath()}
						fill="none" stroke="#fbbf24" stroke-width="2"
						stroke-dasharray="6 3" marker-end="url(#arrow-temp)"
					/>
				{/if}
			</svg>

			<!-- Canvas blocks -->
			{#each canvasBlocks as block (block.id)}
				{@const bh = blockHeight(block)}
				{@const blockDef = defMap[block.typeId]}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute"
					style="left:{block.x}px; top:{block.y}px; width:{BLOCK_WIDTH}px; height:{bh}px;"
					onmousedown={(e) => handleBlockMouseDown(e, block)}
					onclick={(e) => e.stopPropagation()}
					oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); contextMenu = { x: e.clientX, y: e.clientY, blockId: block.id }; }}
				>
					<div
						class="absolute inset-0 select-none overflow-visible rounded-xl border shadow-xl transition-shadow"
						style="border-color:{selectedBlockId === block.id || selectedBlockIds.has(block.id) ? '#60a5fa' : block.color+'55'}; background:linear-gradient(160deg,#1e293b,#0f172a); cursor:move; {selectedBlockId === block.id || selectedBlockIds.has(block.id) ? 'box-shadow:0 0 0 2px #3b82f6, 0 0 16px #3b82f640;' : ''}"
					>
						<!-- Colored top bar -->
						<div class="flex h-8 items-center rounded-t-xl px-2.5" style="background:{block.color}22; border-bottom:1px solid {block.color}40;">
							<span class="text-sm leading-none">{block.icon}</span>
							<span class="ml-1.5 truncate text-[11px] font-semibold text-gray-200">{block.name}</span>
						</div>

						<!-- Port labels -->
						<div class="absolute flex justify-between px-1" style="top:{BLOCK_HEADER}px; left:0; right:0; height:{blockPortH(block)}px;">
							<div class="flex flex-col gap-0 text-left">
								{#each block.inputs as port}
									<div class="flex items-center" style="height:{PORT_ROW_H}px;">
										<span class="text-[9px] text-gray-500 pl-2">{port.label}</span>
										<span class="ml-1 text-[8px] opacity-50" style="color:{PORT_TYPE_COLORS[port.dataType ?? 'any']}">{port.dataType}</span>
									</div>
								{/each}
							</div>
							<div class="flex flex-col gap-0 text-right">
								{#each block.outputs as port}
									<div class="flex items-center justify-end" style="height:{PORT_ROW_H}px;">
										<span class="mr-1 text-[8px] opacity-50" style="color:{PORT_TYPE_COLORS[port.dataType ?? 'any']}">{port.dataType}</span>
										<span class="text-[9px] text-gray-500 pr-2">{port.label}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Params -->
						{#if blockDef?.params && blockDef.params.length > 0}
							<div class="absolute flex flex-col gap-1 px-2 pt-1 pb-1" style="top:{BLOCK_HEADER + blockPortH(block)}px; left:0; right:0;">
								{#each blockDef.params as pDef}
									{@const pHidden = typeof pDef.hidden === "function" ? pDef.hidden({ params: block.params }) : typeof pDef.hidden === "boolean" ? pDef.hidden : false}
									{#if !pHidden}
										{@const pVal = block.params?.[pDef.id] ?? paramDefault(pDef)}
										{#if pDef.label}
											<span class="text-[9px] text-gray-500 leading-tight text-ellipsis text-nowrap overflow-hidden">{pDef.label}</span>
										{/if}
										{#if pDef.type === 'varname'}
											<Dropdown
												value={pVal}
												options={getVarnameOptions((pDef as ParamVarname).category)}
												onchange={(v) => handleVarnameChange(block.id, pDef.id, (pDef as ParamVarname).category, v)}
												onmousedown={(e) => e.stopPropagation()}
												style="height:{PARAM_INPUT_H}px; font-size:10px;"
											/>
										{:else if pDef.type === 'option'}
											<Dropdown
												value={pVal}
												options={pDef.options}
												onchange={(v) => updateBlockParam(block.id, pDef.id, v)}
												onmousedown={(e) => e.stopPropagation()}
												style="height:{PARAM_INPUT_H}px; font-size:10px;"
											/>
										{:else if pDef.type === 'number'}
											<input
												class="port-btn w-full rounded border border-gray-700 bg-gray-900 px-1 py-0.5 text-[10px] text-gray-200 focus:border-blue-500 focus:outline-none"
												style="height:{PARAM_INPUT_H}px"
												type="number"
												step="any"
												value={pVal}
												onmousedown={(e) => e.stopPropagation()}
												onchange={(e) => updateBlockParam(block.id, pDef.id, (e.target as HTMLInputElement).value)}
											/>
										{:else if pDef.type === 'color'}
											{@const colorDef = pDef as ParamColor}
											{@const pValFormat = `0x${(+pVal).toString(16).padStart(4, '0').toUpperCase()}`}
											<div class="flex items-center gap-1 w-full" style="height:{PARAM_INPUT_H}px">
												<input
													class="port-btn rounded border border-gray-700 cursor-pointer shrink-0"
													style="width:{PARAM_INPUT_H}px; height:{PARAM_INPUT_H}px; padding:2px;"
													type="color"
													value={colorParamToHex(pVal, colorDef.format)}
													onmousedown={(e) => e.stopPropagation()}
													onchange={(e) => updateBlockParam(block.id, pDef.id, hexToColorParam((e.target as HTMLInputElement).value, colorDef.format))}
												/>
												<span class="text-[9px] text-gray-400 font-mono truncate select-none">{pValFormat}</span>
											</div>
										{:else}
											<input
												class="port-btn w-full rounded border border-gray-700 bg-gray-900 px-1 py-0.5 text-[10px] text-gray-200 focus:border-blue-500 focus:outline-none"
												style="height:{PARAM_INPUT_H}px"
												type="text"
												value={pVal}
												onmousedown={(e) => e.stopPropagation()}
												oninput={(e) => updateBlockParam(block.id, pDef.id, (e.target as HTMLInputElement).value)}
											/>
										{/if}
									{/if}
								{/each}
							</div>
						{/if}
					</div>

					<!-- Input ports -->
					{#each block.inputs as port, i}
						<div
							class="port-btn absolute flex items-center justify-center"
							style="left:{-PORT_R}px; top:{BLOCK_HEADER + PORT_ROW_H * i + PORT_ROW_H / 2 - PORT_R}px; width:{PORT_R * 2}px; height:{PORT_R * 2}px; z-index:10;"
							role="button"
							tabindex="0"
							aria-label="Input port {port.label}"
							onmouseup={(e) => handleInputPortMouseUp(e, block.id, port.id)}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleInputPortMouseUp(e as unknown as MouseEvent, block.id, port.id); }}
						>
							<div
								class="h-full w-full rounded-full border-2 transition-all hover:scale-125"
								style="border-color:{connectingDataType !== null ? (isCompatible(connectingDataType, port.dataType ?? 'any') ? '#4ade80' : '#ef444466') : PORT_TYPE_COLORS[port.dataType ?? 'any']}; background:{connectingDataType !== null ? (isCompatible(connectingDataType, port.dataType ?? 'any') ? '#14532d' : '#450a0a') : '#0d1117'};"
							></div>
						</div>
					{/each}

					<!-- Output ports -->
					{#each block.outputs as port, i}
						<div
							class="port-btn absolute flex items-center justify-center"
							style="right:{-PORT_R}px; top:{BLOCK_HEADER + PORT_ROW_H * i + PORT_ROW_H / 2 - PORT_R}px; width:{PORT_R * 2}px; height:{PORT_R * 2}px; z-index:10;"
							role="button"
							tabindex="0"
							aria-label="Output port {port.label}"
							onmousedown={(e) => handleOutputPortMouseDown(e, block.id, port.id)}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOutputPortMouseDown(e as unknown as MouseEvent, block.id, port.id); }}
						>
							<div
								class="h-full w-full rounded-full border-2 transition-all hover:scale-125"
								style="border-color:{PORT_TYPE_COLORS[port.dataType ?? 'any']}; background:{connectingFrom?.blockId === block.id && connectingFrom?.portId === port.id ? '#14532d' : '#0d1117'};"
							></div>
						</div>
					{/each}
					<!-- Note label below block -->
					{#if block.note}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute cursor-pointer select-none px-1 text-left text-[11px] leading-snug text-gray-400 transition-colors hover:text-gray-200"
							style="top:{bh + 6}px; left:0; right:0;"
							onclick={(e) => { e.stopPropagation(); editNote(block.id); }}
						>{block.note}</div>
					{/if}
				</div>
			{/each}
		</div><!-- end transform wrapper -->

		<!-- Block context menu -->
		{#if contextMenu}
			{@const menuBlockId = contextMenu.blockId}
			<BlockContextMenu
				x={contextMenu.x}
				y={contextMenu.y}
				onaddnote={() => editNote(menuBlockId)}
				onduplicate={() => duplicateBlock(menuBlockId)}
				onhelp={() => { const def = defMap[canvasBlocks.find((b) => b.id === menuBlockId)?.typeId ?? '']; if (def) onhelp?.(def); contextMenu = null; }}
				ondelete={() => { deleteBlock(menuBlockId); if (selectedBlockId === menuBlockId) selectedBlockId = null; }}
				onclose={() => { contextMenu = null; }}
			/>
		{/if}

		<!-- FAB: Zoom controls -->
		<div class="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
			<button
				onclick={() => zoomAround(1.2)}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-300 shadow-lg transition-all hover:bg-gray-700 hover:text-white hover:scale-110"
				title="ซูมเข้า"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
			<button
				onclick={focusCanvas}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-300 shadow-lg transition-all hover:bg-gray-700 hover:text-white hover:scale-110"
				title="Focus"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V5a1 1 0 011-1h3M4 16v3a1 1 0 001 1h3m10-14h3a1 1 0 011 1v3m-4 10h3a1 1 0 001-1v-3" />
				</svg>
			</button>
			<button
				onclick={() => zoomAround(0.8)}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-300 shadow-lg transition-all hover:bg-gray-700 hover:text-white hover:scale-110"
				title="ซูมออก"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
				</svg>
			</button>
		</div>

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

		<!-- Palette drag ghost -->
		{#if draggingFromPalette && paletteGhost}
			<div
				class="pointer-events-none fixed z-50 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 opacity-80 shadow-xl"
				style="left:{paletteGhost.x + 12}px; top:{paletteGhost.y + 8}px; border-color:{draggingFromPalette.color}55; background:linear-gradient(160deg,#1e293b,#0f172a);"
			>
				<span>{draggingFromPalette.icon}</span>
				<span>{draggingFromPalette.name}</span>
			</div>
		{/if}

		<!-- Hints -->
		{#if connectingFrom}
			<div class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500/20 border border-yellow-500/40 px-4 py-1.5">
				<p class="text-xs text-yellow-300">ปล่อยเมาส์ที่จุด Input เพื่อเชื่อมต่อ — ปล่อยเมาส์พื้นที่ว่างเพื่อยกเลิก</p>
			</div>
		{:else if selectedBlockId}
			<div class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500/20 border border-blue-500/40 px-4 py-1.5">
				<p class="text-xs text-blue-300">บล็อกถูกเลือก — กด <kbd class="rounded bg-blue-900/60 px-1 font-mono">Delete</kbd> เพื่อลบ</p>
			</div>
		{:else if selectedConnId}
			<div class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500/20 border border-yellow-500/40 px-4 py-1.5">
				<p class="text-xs text-yellow-300">เส้นถูกเลือก — กด <kbd class="rounded bg-yellow-900/60 px-1 font-mono">Delete</kbd> เพื่อลบ หรือลากจุดสีเหลืองเพื่อย้าย</p>
			</div>
		{/if}
	</div>

	<!-- ── Right Panel: Block Palette ────────────────────────────── -->
	<aside class="flex w-60 flex-col border-l border-gray-700/60 bg-gray-900">
		<div class="border-b border-gray-700/60 px-3 py-3">
			<div class="relative">
				<svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					placeholder="Search..."
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
								onmousedown={(e) => handlePaletteMouseDown(e, block)}
								class="flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all active:cursor-grabbing active:scale-95 hover:brightness-110"
								style="border-color:{block.color}30; background:linear-gradient(135deg,{block.color}12,{block.color}06);"
								role="button"
								tabindex="0"
								aria-label="บล็อก {block.name}"
							>
								<div
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"
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


<style>
	.conn-group {
		outline: none;
	}
	.conn-group:hover .conn-line {
		stroke: #f87171;
		marker-end: url(#arrow-hover);
	}
</style>
