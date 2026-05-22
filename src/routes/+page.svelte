<script lang="ts">
	import { onMount } from 'svelte';
	import FlowEditor, { type FlowEditorEvent } from '$lib/flowcode/FlowEditor.svelte';
	import ConfirmDialog, { type ConfirmOptions } from '$lib/components/ConfirmDialog.svelte';
	import ShareDialog from '$lib/components/ShareDialog.svelte';
	import Snackbar from '$lib/components/Snackbar.svelte';
	import { snackbar } from '$lib/components/snackbar.svelte.js';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import CodeViewer from '$lib/components/CodeViewer.svelte';
	import boards from '$lib/boards/index.js';
	import type { BoardSetting } from '$lib/boards/types.js';

	function buildFqbn(baseFqbn: string, settings: BoardSetting[], values: Record<string, string>): string {
		if (!settings || settings.length === 0) return baseFqbn;
		const colonParts = baseFqbn.split(':');
		const boardPart  = colonParts.slice(0, 3).join(':');
		const existingOpts = colonParts[3] ?? '';
		const optMap = new Map<string, string>();
		if (existingOpts) {
			for (const pair of existingOpts.split(',')) {
				const eq = pair.indexOf('=');
				if (eq > 0) optMap.set(pair.slice(0, eq), pair.slice(eq + 1));
			}
		}
		for (const setting of settings) {
			const defaultOpt  = setting.options.find(o => o.default);
			const storedValue = values[setting.id] ?? defaultOpt?.value;
			const selected    = setting.options.find(o => o.value === storedValue) ?? defaultOpt;
			if (selected?.default) {
				optMap.delete(setting.id);        // default option → ลบออก (ไม่ inject)
			} else if (selected) {
				optMap.set(setting.id, selected.value); // id เป็น fqbn key, value เป็น fqbn value
			}
		}
		if (optMap.size === 0) return boardPart;
		return `${boardPart}:${[...optMap.entries()].map(([k, v]) => `${k}=${v}`).join(',')}`;
	}
	import type { BlockCategory, BlockDef, CanvasBlock, Connection } from '$lib/blocks/types.js';
	import { FlowcodeAgentClient } from '$lib/agent-client/index.js';
	import {
		FilePlus, FolderOpen, Save, CirclePlay, SquareCode, SlidersHorizontal,
		User, Folder, LogOut, Copy, Terminal,
		Files, Puzzle, CircleQuestionMark,
		ArrowLeft, X, Download, Trash2, CircleCheck,
		Cpu, Usb, Wifi, WifiOff, ChevronsDown, LoaderCircle, CircleStop,
        ChevronRight, MessageCircle, Share2, ExternalLink,
	} from 'lucide-svelte';

	import type { ExtensionProps } from '$lib/blocks/extension/types';
	import extensionIndex from '$lib/blocks/extension';
	import { ansiToHtml } from '$lib/utils/ansiToHtml';

	type ExtensionItem = ExtensionProps & {
		installed: boolean;
	};

	// ─── Multi-file support ──────────────────────────────────────────────
	type Viewport = { zoom: number; panX: number; panY: number };
	type FlowFile = { id: string; name: string; json: string; viewport?: Viewport };

	function _initProject(): { files: FlowFile[]; activeFileId: string } {
		try {
			const v2 = localStorage.getItem('flowcode-project-v2');
			if (v2) {
				const p = JSON.parse(v2);
				if (Array.isArray(p.files) && p.files.length > 0)
					return { files: p.files, activeFileId: p.activeFileId ?? p.files[0].id };
			}
			// migrate v1
			const v1 = localStorage.getItem('flowcode-project');
			const id = `f${Date.now()}`;
			return { files: [{ id, name: 'main.flow', json: v1 ?? '' }], activeFileId: id };
		} catch {
			const id = `f${Date.now()}`;
			return { files: [{ id, name: 'main.flow', json: '' }], activeFileId: id };
		}
	}

	const _proj = _initProject();
	let files = $state<FlowFile[]>(_proj.files);
	let activeFileId = $state<string>(_proj.activeFileId);
	let editingFileId = $state<string | null>(null);

	$effect(() => {
		localStorage.setItem('flowcode-project-v2', JSON.stringify({ files, activeFileId }));
	});

	function flushSave() {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
			if (editor) {
				const json = editor.exportJson();
				const viewport = editor.getViewport();
				files = files.map(f => f.id === activeFileId ? { ...f, json, viewport } : f);
			}
		}
	}

	function switchFile(id: string) {
		if (id === activeFileId) return;
		flushSave();
		if (editor) {
			const json = editor.exportJson();
			const viewport = editor.getViewport();
			files = files.map(f => f.id === activeFileId ? { ...f, json, viewport } : f);
		}
		activeFileId = id;
		const target = files.find(f => f.id === id);
		editor?.importJson(target?.json ?? '', target?.viewport);
		cCode = generateAllCode();
	}

	function addFile() {
		const id = `f${Date.now()}`;
		const usedNames = new Set(files.map(f => f.name));
		let n = files.length + 1;
		while (usedNames.has(`sketch${n}.flow`)) n++;
		const name = `sketch${n}.flow`;
		if (editor) {
			const json = editor.exportJson();
			files = [...files.map(f => f.id === activeFileId ? { ...f, json } : f), { id, name, json: '' }];
		} else {
			files = [...files, { id, name, json: '' }];
		}
		activeFileId = id;
		editor?.clear();
		cCode = '';
	}

	function confirmDeleteFile(id: string, name: string) {
		confirmDialogOption = {
			title: 'Delete file',
			message: `Delete "${name}"? This cannot be undone.`,
			confirmLabel: 'Delete',
			onconfirm: () => deleteFile(id),
		};
		confirmDialogOpen = true;
	}

	function deleteFile(id: string) {
		if (files.length <= 1) return;
		const idx = files.findIndex(f => f.id === id);
		const next = files.filter(f => f.id !== id);
		files = next;
		if (id === activeFileId) {
			const target = next[Math.min(idx, next.length - 1)];
			activeFileId = target.id;
			editor?.importJson(target.json ?? '', target.viewport);
			cCode = generateAllCode();
		}
	}

	function commitRename(id: string, name: string) {
		const trimmed = name.trim();
		if (trimmed) files = files.map(f => f.id === id ? { ...f, name: trimmed } : f);
		editingFileId = null;
	}

	// ─── Merge all files' flows for code generation ──────────────────────
	function mergeAllFlows(): { blocks: CanvasBlock[]; conns: Connection[] } {
		const currentJson = editor?.exportJson() ?? '';
		const snapshot = files.map(f => f.id === activeFileId ? { ...f, json: currentJson } : f);
		const blocks: CanvasBlock[] = [];
		const conns: Connection[] = [];
		for (const file of snapshot) {
			if (!file.json) continue;
			try {
				const data = JSON.parse(file.json);
				const p = file.id + '_';
				for (const b of (data.canvasBlocks ?? []) as CanvasBlock[])
					blocks.push({ ...b, id: p + b.id });
				for (const c of (data.connections ?? []) as Connection[])
					conns.push({ ...c, id: p + c.id, fromBlockId: p + c.fromBlockId, toBlockId: p + c.toBlockId });
			} catch { /* skip malformed file */ }
		}
		return { blocks, conns };
	}

	function generateAllCode(): string {
		if (!editor) return '';
		const { blocks, conns } = mergeAllFlows();
		return editor.generateCodeFromData(blocks, conns);
	}

	// ── Embed / Share ────────────────────────────────────────────────────
	const _urlParams   = new URLSearchParams(window.location.search);
	const isEmbed      = _urlParams.has('embed');
	const openParam    = _urlParams.get('open');

	let shareDialogOpen = $state(false);
	let shareUrl        = $state('');

	async function _compress(str: string): Promise<string> {
		const bytes = new TextEncoder().encode(str);
		const cs = new CompressionStream('deflate-raw');
		const w  = cs.writable.getWriter();
		w.write(bytes); w.close();
		const buf = await new Response(cs.readable).arrayBuffer();
		// URL-safe base64 (Base64URL): replace + → - and / → _ , drop = padding
		return btoa(String.fromCharCode(...new Uint8Array(buf)))
			.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}
	async function _decompress(b64: string): Promise<string> {
		// Restore standard base64 from URL-safe form and re-add padding
		const std    = b64.replace(/-/g, '+').replace(/_/g, '/');
		const padded = std + '='.repeat((4 - std.length % 4) % 4);
		const bytes  = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
		const ds = new DecompressionStream('deflate-raw');
		const w  = ds.writable.getWriter();
		w.write(bytes); w.close();
		return new Response(ds.readable).text();
	}

	async function openShareDialog() {
		const payload = JSON.stringify({
			v:          1,
			board:      selectedBoard.id,
			extensions: extensions.filter(e => e.installed).map(e => e.id),
			flow:       editor?.exportJson() ?? '',
		});
		const b64    = await _compress(payload);
		const origin = `${window.location.origin}${window.location.pathname}`;
		shareUrl     = `${origin}?open=${b64}`;
		shareDialogOpen = true;
	}
	// ─────────────────────────────────────────────────────────────────────

	let extensions = $state<ExtensionItem[]>(extensionIndex.map((e) => ({ ...e, installed: false })));
	let extensionSearch = $state('');
	const filteredExtensions = $derived(() => {
		const q = extensionSearch.trim().toLowerCase();
		if (!q) return extensions;
		return extensions.filter(e =>
			e.name.toLowerCase().includes(q) ||
			e.description.toLowerCase().includes(q)
		);
	});

	let selectedBoard = $state(boards[0]);
	let boardConnected = $state(false);

	// ─── Board settings (per-board, persisted) ───────────────────────
	// allBoardSettings[boardId][settingId] = selectedOptionValue
	// โหลดจาก localStorage ตอน init เพื่อให้ $effect ไม่ทับค่าเดิมก่อน onMount
	let allBoardSettings = $state<Record<string, Record<string, string>>>(
		(() => {
			try {
				const saved = localStorage.getItem('board-settings');
				return saved ? JSON.parse(saved) : {};
			} catch { return {}; }
		})()
	);
	let showBoardSettings = $state(false);

	const currentBoardSettings = $derived(allBoardSettings[selectedBoard.id] ?? {});
	const activeFqbn = $derived(
		buildFqbn(selectedBoard.fqbn, selectedBoard.settings ?? [], currentBoardSettings)
	);

	$effect(() => {
		localStorage.setItem('board-settings', JSON.stringify(allBoardSettings));
	});

	// ─── FlowcodeAgent (shared instance) ────────────────────────────
	const agent = new FlowcodeAgentClient('ws://localhost:8080');
	let agentConnected = $state(false);
	const installedCores = new Set<string>();
	const installedLibs = new Set<string>();
	let lastCompiledHash = '';
	let lastCompiledFqbn = '';
	let availablePorts = $state<string[]>([]);
	let selectedPort = $state(localStorage.getItem('lastSelectedPort') ?? '');

	$effect(() => {
		if (selectedPort) localStorage.setItem('lastSelectedPort', selectedPort);
	});

	agent.onConnect = () => { agentConnected = true; };
	agent.onDisconnect = () => { agentConnected = false; serialConnected = false; };

	// ── Persistent snackbar เมื่อเชื่อมต่อ Agent ไม่ได้ ──────────────
	let agentSnackbarId = $state<number | null>(null);
	$effect(() => {
		if (!agentConnected && !isEmbed) {
			if (agentSnackbarId === null) {
				agentSnackbarId = snackbar.show({
					type: 'error',
					message: 'Cannot connect to FlowCode Agent. Please download/open FlowCode Agent.',
					action: { label: 'Download', href: 'https://github.com/ArtronShop/flowcode-agent/releases' },
					hideClose: true,
				});
			}
		} else {
			if (agentSnackbarId !== null) {
				snackbar.close(agentSnackbarId);
				agentSnackbarId = null;
			}
		}
	});

	// Merge board blocks + installed extension blocks (only installed extensions)
	const boardCategories = $derived<BlockCategory[]>([
		...selectedBoard.blocks,
		...extensions
			.filter((e) => e.installed && typeof e.src !== 'string')
			.map((e) => e.src as BlockCategory),
	]);

	function changeBoard(boardId: string) {
		const next = boards.find((b) => b.id === boardId);
		if (!next || next.id === selectedBoard.id) return;
		console.log('blockList', editor?.blockList());
		/* if ((editor?.blockList().length ?? 0) > 0) {
			confirmDialogOption = {
				title: 'เปลี่ยนบอร์ด',
				message: `เปลี่ยนเป็น "${next.name}" จะล้างบล็อกทั้งหมดในพื้นที่ทำงาน ยืนยันหรือไม่?`,
				confirmLabel: 'เปลี่ยนบอร์ด',
				onconfirm: () => {
					selectedBoard = next;
					editor?.clear();
				},
			};
			confirmDialogOpen = true;
		} else { */
			selectedBoard = next;
		//}
		handleEditorChange('project:load');
	}

	type SidePanel = 'files' | 'extensions' | 'help' | null;
	let activePanel = $state<SidePanel>(null);

	function togglePanel(panel: SidePanel) {
		activePanel = activePanel === panel ? null : panel;
	}

	let editor = $state<FlowEditor | null>(null);
	let cCode = $state('');
	let runLogs = $state<string[]>([]);
	let serialLogs = $state<string[]>([]);
	let serialConnected = $state(false);
	let serialBaudRate = $state('115200');
	let serialMessage = $state('');
	let serialLineEnding = $state('');
	let isConnectingSerial = $state(false);
	let isRunning = $state(false);
	let runErrorSnackbarId = $state<number | null>(null);
	type ConsoleTab = 'code' | 'run' | 'serial';
	let activeConsoleTab = $state<ConsoleTab | null>(null);
	let autoScrollRun = $state(true);
	let autoScrollSerial = $state(true);
	let runLogEl = $state<HTMLPreElement | null>(null);
	let serialLogEl = $state<HTMLPreElement | null>(null);
	let consoleHeight = $state(208);
	let isResizing = $state(false);
	let panelWidth = $state(256);
	let isPanelResizing = $state(false);

	function startPanelResize(e: MouseEvent) {
		const startX = e.clientX;
		const startWidth = panelWidth;
		isPanelResizing = true;
		const onMove = (e: MouseEvent) => {
			panelWidth = Math.max(160, Math.min(480, startWidth + e.clientX - startX));
		};
		const onUp = () => {
			isPanelResizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	function startResize(e: MouseEvent) {
		const startY = e.clientY;
		const startHeight = consoleHeight;
		isResizing = true;
		const onMove = (e: MouseEvent) => {
			consoleHeight = Math.max(80, Math.min(600, startHeight + startY - e.clientY));
		};
		const onUp = () => {
			isResizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	$effect(() => {
		if (autoScrollRun && runLogs.length > 0 && runLogEl) {
			runLogEl.scrollTop = runLogEl.scrollHeight;
		}
	});

	$effect(() => {
		if (autoScrollSerial && serialLogs.length > 0 && serialLogEl) {
			serialLogEl.scrollTop = serialLogEl.scrollHeight;
		}
	});
	let showUserMenu = $state(false);
	let status = $state<{
		blockCount: number; connCount: number; zoom: number;
	}>();

	let helpBlockDef = $state<BlockDef | null>(null);

	function openBlockHelp(def: BlockDef) {
		helpBlockDef = def;
		activePanel = 'help';
	}

	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveTimer = null;
			const json = editor!.exportJson();
			const viewport = editor!.getViewport();
			files = files.map(f => f.id === activeFileId ? { ...f, json, viewport } : f);
		}, 2000);
	}

	function handleEditorChange(event: FlowEditorEvent) {
		status = {
			blockCount: editor!.blockList().length,
			connCount: editor!.connectionList().length,
			zoom: editor!.getZoom(),
		};

		if (event === 'zoom') {
			const viewport = editor!.getViewport();
			files = files.map(f => f.id === activeFileId ? { ...f, viewport } : f);
			return;
		}
		if (event === 'block:focus' || event === 'block:blur'
			|| event === 'conn:focus' || event === 'conn:blur' || event === 'block:move') return;

		scheduleSave();
		cCode = generateAllCode();
	}
	
	let confirmDialogOpen = $state(false);
	let confirmDialogOption = $state<ConfirmOptions>({});

	function newProject() {
		confirmDialogOption = {
			title: 'New Project',
			message: 'All files and blocks will be cleared. Continue?',
			confirmLabel: 'Create New',
			onconfirm: () => {
				const id = `f${Date.now()}`;
				files = [{ id, name: 'main.flow', json: '' }];
				activeFileId = id;
				editor?.clear();
				cCode = '';
			},
		};
		confirmDialogOpen = true;
	}

	async function saveProject() {
		// Save current file state first
		const currentJson = editor?.exportJson() ?? '';
		const snapshot = files.map(f => f.id === activeFileId ? { ...f, json: currentJson } : f);
		const data = JSON.stringify({ v: 2, files: snapshot, activeFileId }, null, 2);
		const firstName = snapshot[0]?.name ?? 'project';
		if ('showSaveFilePicker' in window) {
			try {
				const handle = await (window as any).showSaveFilePicker({
					suggestedName: `${firstName}.flowcode.json`,
					types: [{ description: 'FlowCode Project', accept: { 'application/json': ['.json'] } }]
				});
				const writable = await handle.createWritable();
				await writable.write(data);
				await writable.close();
			} catch (e: any) {
				if (e.name !== 'AbortError') console.error(e);
			}
		} else {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
			a.download = `${firstName}.flowcode.json`;
			a.click();
			URL.revokeObjectURL(a.href);
		}
	}

	async function openProject() {
		async function _loadText(): Promise<string | null> {
			if ('showOpenFilePicker' in window) {
				try {
					const [handle] = await (window as any).showOpenFilePicker({
						types: [{ description: 'FlowCode Project', accept: { 'application/json': ['.json'] } }]
					});
					return await (await handle.getFile()).text();
				} catch (e: any) {
					if (e.name !== 'AbortError') console.error(e);
					return null;
				}
			} else {
				return new Promise(resolve => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = '.json,application/json';
					input.onchange = async () => resolve(input.files?.[0] ? await input.files[0].text() : null);
					input.click();
				});
			}
		}
		const text = await _loadText();
		if (!text) return;
		try {
			const data = JSON.parse(text);
			if (data.v === 2 && Array.isArray(data.files) && data.files.length > 0) {
				// Multi-file format
				files = data.files;
				activeFileId = data.activeFileId ?? data.files[0].id;
				const target = data.files.find((f: FlowFile) => f.id === activeFileId) ?? data.files[0];
				editor?.importJson(target.json ?? '', target.viewport);
			} else {
				// Legacy single-file format — load as single file named 'main'
				const id = `f${Date.now()}`;
				files = [{ id, name: 'main.flow', json: text }];
				activeFileId = id;
				editor?.importJson(text);
			}
			cCode = generateAllCode();
		} catch {
			snackbar.show({ type: 'error', message: 'Failed to load project file' });
		}
	}

	async function hashCode(code: string): Promise<string> {
		const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
		return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
	}

	async function runProject() {
		if (isRunning) return;
		// ลบ snackbar error จาก Run ครั้งก่อน (ถ้ามี)
		if (runErrorSnackbarId !== null) { snackbar.close(runErrorSnackbarId); runErrorSnackbarId = null; }

		// ── Check required blocks ─────────────────────────────────────────
		const missingMap = editor?.checkRequires() ?? new Map();
		if (missingMap.size > 0) {
			const lines = [...missingMap.entries()].map(([reqId, users]) => {
				const reqName = editor?.getBlockName(reqId) ?? reqId;
				return `  • ${reqName}  (required by: ${users.join(', ')})`;
			});
			confirmDialogOption = {
				title: '⚠️ Missing Required Blocks',
				message: `Please add the following blocks to the canvas:\n${lines.join('\n')}`,
				confirmLabel: 'OK',
				hideCancel: true,
			};
			confirmDialogOpen = true;
			return;
		}
		// ─────────────────────────────────────────────────────────────────

		if (!agentConnected) return;

		isRunning = true;
		runLogs = [];
		// activeConsoleTab = 'run';

		const log = (msg: string) => { runLogs = [...runLogs, msg + '\n']; };

		const sketchName = 'flowcode_project';
		const code = generateAllCode();
		const board = selectedBoard;
		const installedDeps = extensions
			.filter((e) => e.installed && Array.isArray(e.depends))
			.flatMap((e) => e.depends as string[]);

		try {
			agent.onStream = (p) => { runLogs = [...runLogs, p.data]; };

			// 1. Install core (ครั้งแรกเท่านั้น)
			const coreKey = `${board.platform.id}@${board.platform.version}`;
			if (!installedCores.has(coreKey)) {
				log(`📦 Installing core: ${coreKey}`);
				await agent.installCore(board.platform.id, board.platform.version, board.platform.package);
				installedCores.add(coreKey);
				log('✅ Core installed');
			} else {
				log(`⏭ Skipping core (already installed): ${coreKey}`);
			}

			// 2. Install libraries (ติดตั้งเฉพาะที่ยังไม่เคยติดตั้ง)
			const allDeps = [...(board.depends ?? []), ...installedDeps];
			const newDeps = allDeps.filter((d) => !installedLibs.has(d));
			if (newDeps.length > 0) {
				log(`📚 Installing libraries: ${newDeps.join(', ')}`);
				await agent.installLibrary(newDeps);
				newDeps.forEach((d) => installedLibs.add(d));
				log('✅ Libraries installed');
			} else if (allDeps.length > 0) {
				log('⏭ Skipping libraries (all installed)');
			}

			// 3 & 4. Write + Compile (ข้ามถ้าโค้ดและ fqbn เหมือนเดิม)
			const fqbn = activeFqbn;
			const currentHash = await hashCode(code);
			if (currentHash === lastCompiledHash && fqbn === lastCompiledFqbn) {
				log('⏭ Skipping write & compile (code unchanged)');
			} else {
				log(`📝 Writing sketch: ${sketchName}`);
				await agent.writeSketch(sketchName, code);
				log('✅ Sketch written');

				log(`🔨 Compiling (${fqbn})...`);
				await agent.compile(sketchName, fqbn);
				log('✅ Compiled successfully');

				lastCompiledHash = currentHash;
				lastCompiledFqbn = fqbn;
			}

			// Disconnect Serial Port before upload
			let serialConnectAfterUpload = false;
			if (serialConnected) {
				await toggleSerialConnect();
				serialConnectAfterUpload = true;
			}

			// 5. Upload
			if (!selectedPort) throw new Error('Please select a port before uploading');
			log(`🚀 Uploading to ${selectedPort}...`);
			await agent.upload(sketchName, fqbn, selectedPort);
			log('✅ Upload complete');

			if (serialConnectAfterUpload) {
				setTimeout(toggleSerialConnect, 500); // wait port are ready again before connect
			}

			snackbar.show({ type: 'success', message: 'Done', autoClose: 5000 });
		} catch (e: any) {
			log(`❌ Error: ${e?.message ?? String(e)}`);
			runErrorSnackbarId = snackbar.show({ type: 'error', message: `Run failed: ${e?.message ?? String(e)}` });
		} finally {
			isRunning = false;
		}
	}

	async function refreshPorts() {
		if (!agentConnected) { availablePorts = []; return []; }
		try {
			const list = await agent.listPorts();
			availablePorts = list.map(p => p.path);
			return availablePorts.map(p => ({ value: p, label: p }));
		} catch {
			availablePorts = [];
			return [];
		}
	}

	async function toggleSerialConnect() {
		if (!selectedPort) return;
		isConnectingSerial = true;
		try {
			if (serialConnected) {
				await agent.disconnectPort(selectedPort);
				serialConnected = false;
				// serialLogs = [...serialLogs, `[disconnected from ${selectedPort}]`];
			} else {
				await agent.connectPort(selectedPort, Number(serialBaudRate));
				serialConnected = true;
				// serialLogs = [...serialLogs, `[connected to ${selectedPort} @ ${serialBaudRate} baud]`];
			}
		} catch (e: any) {
			serialLogs = [...serialLogs, `[error: ${e?.message ?? String(e)}]`];
		} finally {
			isConnectingSerial = false;
		}
	}

	async function sendSerialMessage() {
		if (!serialConnected || !serialMessage.trim()) return;
		try {
			await agent.writePort(selectedPort, serialMessage + serialLineEnding);
			// serialLogs = [...serialLogs, `> ${serialMessage}`];
			serialMessage = '';
		} catch (e: any) {
			serialLogs = [...serialLogs, `[send error: ${e?.message ?? String(e)}]\n`];
		}
	}

	// Auto load project from Local Storage or ?open= URL param
	onMount(async () => {
		if (openParam) {
			// Set shareUrl so embed's 'Open in new window' button works immediately
			const origin = `${window.location.origin}${window.location.pathname}`;
			shareUrl = `${origin}?open=${openParam}`;
			// ── Load from shared URL ───────────────────────────────────
			try {
				const json = await _decompress(openParam);
				const data = JSON.parse(json) as { v: number; board: string; extensions: string[]; flow: string };
				const board = boards.find(b => b.id === data.board);
				if (board) selectedBoard = board;
				if (data.extensions) {
					const ids = new Set(data.extensions);
					extensions = extensions.map(e => ({ ...e, installed: ids.has(e.id) }));
				}
				if (data.flow) editor?.importJson(data.flow);
			} catch (e) {
				console.error('Failed to load from ?open param', e);
				snackbar.show({ type: 'error', message: 'Failed to load workflow from URL' });
			}
		} else {
			// ── Load board select from local storage ───────────────────
			const selectedBoardId = localStorage.getItem('board-select');
			if (selectedBoardId) {
				const next = boards.find((b) => b.id === selectedBoardId);
				if (next) selectedBoard = next;
			}

			// Restore installed extensions
			const savedExtIds = localStorage.getItem('installed-extensions');
			if (savedExtIds) {
				const ids = new Set(JSON.parse(savedExtIds) as string[]);
				extensions = extensions.map((e) => ({ ...e, installed: ids.has(e.id) }));
			}

			// Load active file into editor (restore saved viewport if available)
			const target = files.find(f => f.id === activeFileId) ?? files[0];
			if (target?.json) editor?.importJson(target.json, target.viewport);
		}

		const savedTab = localStorage.getItem('console-tab');
		activeConsoleTab = (savedTab === 'code' || savedTab === 'run' || savedTab === 'serial') ? savedTab : null;

		const savedPanel = localStorage.getItem('side-panel') as SidePanel;
		activePanel = savedPanel ?? null;

		const savedConsoleHeight = localStorage.getItem('console-height');
		if (savedConsoleHeight) {
			consoleHeight = Math.max(80, Math.min(600, +savedConsoleHeight));
		}

		const savedPanelWidth = localStorage.getItem('panel-width');
		if (savedPanelWidth) {
			panelWidth = Math.max(160, Math.min(480, +savedPanelWidth));
		}

		// Connect FlowcodeAgent on startup with auto-reconnect
		agent.onPortData = (p) => { serialLogs = [...serialLogs, String(p.data)]; };
		agent.onPortClose = () => { serialConnected = false; };
		agent.start();
	});

	$effect(() => {
		localStorage.setItem('console-tab', activeConsoleTab ?? '');
	});

	$effect(() => {
		const ids = extensions.filter((e) => e.installed).map((e) => e.id);
		localStorage.setItem('installed-extensions', JSON.stringify(ids));
	});

	function installExtension(ext: ExtensionItem) {
		ext.installed = true;
		// TODO: fix extension block conflict board block
		/* for (const reqId of ext.requires ?? []) {
			const dep = extensions.find((e) => e.id === reqId);
			if (dep && !dep.installed) dep.installed = true;
		} */
	}

	$effect(() => {
		localStorage.setItem('side-panel', activePanel ?? '');
	});

	$effect(() => {
		localStorage.setItem('board-select', selectedBoard.id);
	});

	$effect(() => {
		localStorage.setItem('console-height', consoleHeight.toString());
	});

	$effect(() => {
		localStorage.setItem('panel-width', panelWidth.toString());
	});
</script>

<svelte:window onkeydown={(e) => {
	// ส่ง event ให้ FlowEditor จัดการก่อน (Del, Esc, Ctrl+A ฯลฯ)
	editor?.handleExternalKeyDown(e);
	// จัดการ project-level shortcuts
	const active = document.activeElement;
	const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
	if (isInput) return;
	if (e.ctrlKey && e.code === 'KeyO') { e.preventDefault(); openProject(); }
	else if (e.ctrlKey && e.code === 'KeyN') { e.preventDefault(); newProject(); }
	else if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); saveProject(); }
	else if (e.ctrlKey && e.code === 'KeyR') { e.preventDefault(); runProject(); }
	else if (e.ctrlKey && e.code === 'KeyM') { e.preventDefault(); activeConsoleTab = 'serial'; }
	else if (e.ctrlKey && e.code === 'KeyH') { e.preventDefault(); togglePanel('help'); helpBlockDef = null; }
	else if (e.ctrlKey && e.code === 'KeyE') { e.preventDefault(); togglePanel('extensions'); }
}} />

<ConfirmDialog
	bind:open={confirmDialogOpen}
	{...confirmDialogOption}
/>

<ShareDialog bind:open={shareDialogOpen} {shareUrl} />

<Snackbar />

<!-- Resize overlay: blocks all pointer events while dragging -->
{#if isResizing}
	<div class="fixed inset-0 z-50 cursor-ns-resize"></div>
{/if}
{#if isPanelResizing}
	<div class="fixed inset-0 z-50 cursor-ew-resize"></div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white"
	onclick={() => { showUserMenu = false; showBoardSettings = false; }}
	onkeydown={(e) => { if (e.key === 'Escape') { showUserMenu = false; showBoardSettings = false; } }}
>
	<!-- ─── Top Navbar ──────────────────────────────────────────────── -->
	<header class="z-20 flex items-center justify-between border-b border-gray-700/60 bg-gray-900 px-4 py-2 shadow-lg">
		<div class="flex items-center gap-1">
			<span class="mr-3 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-base font-bold text-transparent">
				FlowCode
			</span>

			{#if !isEmbed}
			<!-- New Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="New"
				onclick={() => newProject()}
			>
				<FilePlus size={16} />
				<span class="hidden sm:inline">New</span>
			</button>

			<!-- Open Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="Open"
				onclick={() => openProject()}
			>
				<FolderOpen size={16} />
				<span class="hidden sm:inline">Open</span>
			</button>
			{/if}

			<!-- Save Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="Save"
				onclick={() => saveProject()}
			>
				<Save size={16} />
				<span class="hidden sm:inline">Save</span>
			</button>

			<div class="mx-1 h-5 w-px bg-gray-700"></div>

			<!-- Board selector + settings -->
			<div class="flex items-center gap-1 px-1">
				<Cpu size={13} class="shrink-0 text-gray-500" />
				<div class="w-36">
					<Dropdown
						value={selectedBoard.id}
						options={boards.map((b) => ({ value: b.id, label: b.name }))}
						onchange={(v) => changeBoard(v)}
						placeholder="Select board"
						style="font-size:12px; padding: 3px 8px;"
					/>
				</div>

				<!-- Board settings button -->
				<div class="relative">
					<button
						class="flex h-7 w-7 items-center justify-center rounded transition-colors
							   {showBoardSettings ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
						title="Board Settings"
						onclick={(e) => { e.stopPropagation(); showBoardSettings = !showBoardSettings; }}
					>
						<SlidersHorizontal size={13} />
					</button>

					{#if showBoardSettings}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="absolute left-0 top-9 z-50 w-32 rounded-xl border border-gray-700 bg-gray-800 p-2 pb-0 shadow-2xl"
						onmousedown={(e) => e.stopPropagation()}
						onclick={(e) => e.stopPropagation()}
					>
						{#each selectedBoard.settings as setting}
							<div class="mb-2">
								<span class="mb-1 block text-[10px] text-gray-400">{setting.label}</span>
								<Dropdown
									value={currentBoardSettings[setting.id] ?? setting.options.find(o => o.default)?.value ?? setting.options[0]?.value}
									options={setting.options.map(o => ({ value: o.value, label: o.label }))}
									onchange={(v) => {
										allBoardSettings = {
											...allBoardSettings,
											[selectedBoard.id]: { ...currentBoardSettings, [setting.id]: v }
										};
									}}
									style="font-size:11px; padding: 3px 8px;"
								/>
							</div>
						{/each}
					</div>
					{/if}
				</div>
			</div>

			<!-- Port selector -->
			<div class="flex items-center gap-1.5 w-36 px-1">
				<Usb size={13} class="shrink-0 {agentConnected ? 'text-gray-400' : 'text-gray-600'}" />
				<Dropdown
					value={selectedPort}
					loadOptions={refreshPorts}
					onchange={(v) => selectedPort = v}
					disabled={!agentConnected}
					placeholder="Select Port"
					emptyText="Not Found"
					style="font-size:12px; padding: 3px 8px;"
				/>
			</div>

			<!-- Run -->
			<button
				onclick={() => runProject()}
				disabled={isRunning}
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-white transition-colors {isRunning ? 'cursor-not-allowed bg-green-900 opacity-60' : 'bg-green-700 hover:bg-green-600'}"
			>
				{#if isRunning}
					<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
				{:else}
					<CirclePlay size={16} />
				{/if}
				<span>{isRunning ? 'Running...' : 'Run'}</span>
			</button>

			{#if !isEmbed}
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				onclick={() => activeConsoleTab = "serial"}
				disabled={isRunning}
			>
				<Terminal size={16} />
				<span>Serial Monitor</span>
			</button>

			<!-- Share -->
			<div class="mx-1 h-5 w-px bg-gray-700"></div>
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="Share"
				onclick={() => openShareDialog()}
			>
				<Share2 size={16} />
				<span class="hidden sm:inline">Share</span>
			</button>
			{:else}
			<!-- Embed: Open in new window -->
			<a
				href={shareUrl || '#'}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="Open in new window"
				onclick={async (e) => {
					if (!shareUrl) {
						e.preventDefault();
						await openShareDialog();
					}
				}}
			>
				<ExternalLink size={16} />
				<span>Open in new window</span>
			</a>
			{/if}
		</div>

		<!-- User Avatar -->
		{#if !isEmbed}
		<div class="relative">
			<button
				onclick={(e) => { e.stopPropagation(); showUserMenu = !showUserMenu; }}
				class="h-8 w-8 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500"
				aria-label="User menu"
			>
				<div class="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-sm font-bold">
					S
				</div>
			</button>

			{#if showUserMenu}
				<div class="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
					<div class="border-b border-gray-700 px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-sm font-bold">
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
							<User size={16} class="text-gray-400" />
							Profile
						</button>
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
							<Folder size={16} class="text-gray-400" />
							My Projects
						</button>
					</div>
					<div class="border-t border-gray-700 py-1">
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-gray-700/50 hover:text-red-300">
							<LogOut size={16} />
							Sign out
						</button>
					</div>
				</div>
			{/if}
		</div>
		{/if}
	</header>

	<!-- ─── Main area (sidebar + editor) ──────────────────────────── -->
	<div class="flex flex-1 overflow-hidden">

		{#if !isEmbed}
		<!-- ── Icon rail ───────────────────────────────────────────── -->
		<nav class="flex w-12 flex-col shrink-0 items-center gap-1 border-r border-gray-700/60 bg-gray-900 py-2">
			<button
				onclick={() => togglePanel('files')}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'files' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="Files"
			>
				<Files size={18} />
			</button>
			<button
				onclick={() => togglePanel('extensions')}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'extensions' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="Extensions"
			>
				<Puzzle size={18} />
			</button>
			<div class="flex-1"></div>
			<button
				onclick={() => { togglePanel('help'); helpBlockDef = null; }}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'help' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="Help"
			>
				<CircleQuestionMark size={18} />
			</button>
			<a
				href="https://docs.google.com/forms/d/e/1FAIpQLSfu1sHKHX_ruOAXCKWQR37l-YmX-y-oQ-2iNadISVHftOnseQ/viewform?usp=publish-editor"
				target="_blank"
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors text-gray-500 hover:bg-gray-700 hover:text-white"
				title="Report issue"
			>
				<MessageCircle size={18} />
			</a>
		</nav>

		<!-- ── Side panel ──────────────────────────────────────────── -->
		{#if activePanel}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="relative flex shrink-0 flex-col border-r border-gray-700/60 bg-gray-900" style="width: {panelWidth}px">
				<!-- Resize handle -->
				<div
					class="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize z-20 transition-colors {isPanelResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/20'}"
					onmousedown={startPanelResize}
				></div>
				<!-- Panel header -->
				<div class="flex items-center justify-between border-b border-gray-700/60 px-4 py-3">
					<div class="flex gap-2">
						{#if activePanel === 'help' && helpBlockDef}
							<button onclick={() => helpBlockDef = null} aria-label="Back" class="text-gray-600 hover:text-gray-300 transition-colors">
								<ArrowLeft size={16} />
							</button>
						{/if}
						<span class="text-xs font-semibold uppercase tracking-widest text-gray-400">
							{#if activePanel === 'files'}Files
							{:else if activePanel === 'extensions'}Extensions
							{:else if activePanel === 'help'}Help
							{/if}
						</span>
					</div>
					<button onclick={() => activePanel = null} aria-label="Close" class="text-gray-600 hover:text-gray-300 transition-colors">
						<X size={16} />
					</button>
				</div>

				<!-- Panel content -->
				<div class="flex-1 overflow-y-auto p-3">
					{#if activePanel === 'files'}
						<div class="space-y-3">
							<!-- File tabs -->
							<div>
								<div class="mb-1.5 flex items-center justify-between">
									<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Files</span>
									<button
										onclick={addFile}
										class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
										title="New file"
									>
										<FilePlus size={12} />Add
									</button>
								</div>
								<div class="space-y-0.5">
									{#each files as file (file.id)}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors {file.id === activeFileId ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
											onclick={() => switchFile(file.id)}
											onkeydown={(e) => e.key === 'Enter' && switchFile(file.id)}
											role="button"
											tabindex="0"
										>
											<svg class="h-3.5 w-3.5 shrink-0 {file.id === activeFileId ? 'text-blue-400' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											{#if editingFileId === file.id}
												<!-- svelte-ignore a11y_autofocus -->
												<input
													class="min-w-0 flex-1 rounded border border-blue-500 bg-gray-800 px-1 py-0 text-[11px] text-white outline-none"
													value={file.name}
													autofocus
													onclick={(e) => e.stopPropagation()}
													onkeydown={(e) => {
														e.stopPropagation();
														if (e.key === 'Enter') commitRename(file.id, (e.currentTarget as HTMLInputElement).value);
														if (e.key === 'Escape') editingFileId = null;
													}}
													onblur={(e) => commitRename(file.id, (e.currentTarget as HTMLInputElement).value)}
												/>
											{:else}
												<span
													class="min-w-0 flex-1 truncate text-[11px]"
													ondblclick={(e) => { e.stopPropagation(); editingFileId = file.id; }}
												>{file.name}</span>
											{/if}
											{#if files.length > 1}
												<button
													class="ml-auto shrink-0 rounded p-0.5 text-gray-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-900/40 hover:text-red-400"
													onclick={(e) => { e.stopPropagation(); confirmDeleteFile(file.id, file.name); }}
													title="Delete file"
												>
													<X size={11} />
												</button>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						</div>
					{:else if activePanel === 'extensions'}
						<div class="space-y-2">
							<input
								bind:value={extensionSearch}
								type="text"
								placeholder="Search extensions…"
								class="mb-3 w-full rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
							/>
							{#if filteredExtensions().filter(a => a.installed).length > 0}
							<p class="mb-1 text-[11px] text-gray-500">Installed</p>
							{/if}
							{#each filteredExtensions().filter(a => a.installed) as ext}
								<div class="rounded-lg border border-gray-700/60 bg-gray-800/40 px-3 py-2.5 text-xs">
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-1.5">
												<span class="font-semibold text-gray-200">{ext.name}</span>
												<span class="rounded bg-gray-700 px-1 py-px font-mono text-[9px] text-gray-400">v{ext.version}</span>
												{#if ext.installed}
													<CircleCheck size={11} class="ml-auto shrink-0 text-green-500" />
												{/if}
											</div>
											<p class="mt-0.5 text-[10px] text-gray-500">by {ext.author}</p>
											<p class="mt-1 leading-snug text-gray-400">{ext.description}</p>
										</div>
									</div>
									<div class="mt-2.5 flex justify-end">
										{#if ext.installed}
											<button
												onclick={() => ext.installed = false}
												class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
											>
												<Trash2 size={11} />Uninstall
											</button>
										{:else}
											<button
												onclick={() => installExtension(ext)}
												class="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[10px] text-blue-400 transition-colors hover:bg-blue-600/40 hover:text-blue-300"
											>
												<Download size={11} />Install
											</button>
										{/if}
									</div>
								</div>
							{/each}
							{#if filteredExtensions().filter(a => !a.installed).length > 0}
							<!-- <hr class="border-gray-700/60 mb-3" /> -->
							<p class="mt-3 mb-1 text-[11px] text-gray-500">Not installed</p>
							{/if}
							{#each filteredExtensions().filter(a => !a.installed) as ext}
								<div class="rounded-lg border border-gray-700/60 bg-gray-800/40 px-3 py-2.5 text-xs">
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-1.5">
												<span class="font-semibold text-gray-200">{ext.name}</span>
												<span class="rounded bg-gray-700 px-1 py-px font-mono text-[9px] text-gray-400">v{ext.version}</span>
												{#if ext.installed}
													<CircleCheck size={11} class="ml-auto shrink-0 text-green-500" />
												{/if}
											</div>
											<p class="mt-0.5 text-[10px] text-gray-500">by {ext.author}</p>
											<p class="mt-1 leading-snug text-gray-400">{ext.description}</p>
										</div>
									</div>
									<div class="mt-2.5 flex justify-end">
										{#if ext.installed}
											<button
												onclick={() => ext.installed = false}
												class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
											>
												<Trash2 size={11} />Uninstall
											</button>
										{:else}
											<button
												onclick={() => installExtension(ext)}
												class="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[10px] text-blue-400 transition-colors hover:bg-blue-600/40 hover:text-blue-300"
											>
												<Download size={11} />Install
											</button>
										{/if}
									</div>
								</div>
							{/each}
							{#if filteredExtensions().length === 0}
								<p class="py-4 text-center text-[11px] text-gray-500">No extensions found for "{extensionSearch}"</p>
							{/if}
						</div>
					{:else if activePanel === 'help'}
						{#if helpBlockDef}
							<!-- ── Block detail view ───────────────────── -->
							<div class="space-y-3 text-xs text-gray-400">
								<div class="flex items-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2">
									<span class="text-xl leading-none">{helpBlockDef.icon}</span>
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-white">{helpBlockDef.name}</p>
										<p class="font-mono text-[9px] text-gray-500">{helpBlockDef.category}</p>
									</div>
								</div>
								{#if helpBlockDef.description}
									<p class="leading-relaxed text-gray-300">{helpBlockDef.description}</p>
								{/if}
								{#if helpBlockDef.inputs.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Inputs</p>
										<ul class="space-y-2">
											{#each helpBlockDef.inputs as port}
												<li class="rounded bg-gray-800/60 px-2 py-1.5">
													<p class="font-medium text-gray-300">{port.label} <span class="font-mono text-[9px] text-gray-500">({port.dataType})</span></p>
													{#if port.description}
														<p class="mt-0.5 text-[11px] text-gray-500">{port.description}</p>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if helpBlockDef.outputs.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Outputs</p>
										<ul class="space-y-2">
											{#each helpBlockDef.outputs as port}
												<li class="rounded bg-gray-800/60 px-2 py-1.5">
													<p class="font-medium text-gray-300">{port.label} <span class="font-mono text-[9px] text-gray-500">({port.dataType})</span></p>
													{#if port.description}
														<p class="mt-0.5 text-[11px] text-gray-500">{port.description}</p>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if helpBlockDef.params && helpBlockDef.params.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Parameters</p>
										<ul class="space-y-2">
											{#each helpBlockDef.params as param}
												<li class="rounded bg-gray-800/60 px-2 py-1.5">
													<p class="font-medium text-gray-300">{param.label ?? param.id} <span class="font-mono text-[9px] text-gray-500">({param.type})</span></p>
													{#if param.description}
														<p class="mt-0.5 text-[11px] text-gray-500">{param.description}</p>
													{/if}
													{#if param.type === 'option'}
														{#each (typeof param.options === 'function' ? param.options({}) : param.options) as item}
															<ul class="list-disc pl-6 space-y-2 mt-0.5">
																<li class="mb-0.5 text-gray-500">
																	{item.label}
																	{#if item.description}
																		 — {item.description}
																	{/if}
																</li>
															</ul>
														{/each}
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{:else}
							<!-- ── Home view: guide + block list ──────── -->
							<div class="space-y-4 text-xs text-gray-400">
								<div>
									<p class="mb-1.5 font-semibold text-gray-300">Basic Usage</p>
									<ul class="space-y-1 leading-relaxed">
										<li>• Drag blocks from the <span class="text-white">Blocks</span> panel onto the canvas</li>
										<li>• Click an Output port, then an Input port to connect</li>
										<li>• Click a block to select it, press <kbd class="rounded bg-gray-700 px-1 font-mono">Del</kbd> to delete</li>
										<li>• <kbd class="rounded bg-gray-700 px-1 font-mono">Shift</kbd> + click to add to selection</li>
										<li>• <kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd> + drag on empty space to box-select</li>
										<li>• Right-click a block → Help to view details</li>
										<li>• Scroll to zoom, drag empty space to pan the canvas</li>
									</ul>
								</div>

								<hr class="border-gray-700/60" />

								<div>
									<p class="mb-1.5 font-semibold text-gray-300">Keyboard Shortcuts</p>

									<p class="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Project</p>
									<ul class="space-y-1.5 leading-relaxed text-xs">
										<li class="flex items-center justify-between gap-2">
											<span>Open project</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">O</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>New project</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">N</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Save project</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">S</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Run &amp; upload</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">R</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Serial Monitor</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">M</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Toggle Help</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">H</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Toggle Extensions</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">E</kbd></span>
										</li>
									</ul>

									<p class="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Selection</p>
									<ul class="space-y-1.5 leading-relaxed text-xs">
										<li class="flex items-center justify-between gap-2">
											<span>Select all</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">A</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Box select (drag)</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">Drag</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Add to selection</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Shift</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">Click</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Deselect</span>
											<kbd class="rounded bg-gray-700 px-1 font-mono">Esc</kbd>
										</li>
									</ul>

									<p class="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Edit</p>
									<ul class="space-y-1.5 leading-relaxed text-xs">
										<li class="flex items-center justify-between gap-2">
											<span>Copy</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">C</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Cut (move across files)</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">X</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Paste</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">V</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Duplicate</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">D</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Delete selected</span>
											<kbd class="rounded bg-gray-700 px-1 font-mono">Del</kbd>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Undo</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">Z</kbd></span>
										</li>
										<li class="flex items-center justify-between gap-2">
											<span>Redo</span>
											<span class="flex gap-1"><kbd class="rounded bg-gray-700 px-1 font-mono">Ctrl</kbd><kbd class="rounded bg-gray-700 px-1 font-mono">Y</kbd></span>
										</li>
									</ul>
								</div>

								<hr class="border-gray-700/60" />

								<div>
									<p class="mb-2 font-semibold text-gray-300">All Blocks</p>
									<div class="space-y-3">
										{#each boardCategories as cat}
											<div>
												<p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{cat.name}</p>
												<ul>
													{#each cat.blocks as def}
														<li>
															<button
																onclick={() => helpBlockDef = def}
																class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-gray-700/70 hover:text-white"
															>
																<span class="w-5 shrink-0 text-center text-sm leading-none">{def.icon}</span>
																<span class="flex-1 truncate">{def.name}</span>
																<span class="shrink-0 text-gray-600"><ChevronRight size={12} /></span>
															</button>
														</li>
													{/each}
												</ul>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
		{/if}
		
		<div class="flex min-h-0 min-w-0 flex-col grow">
			<!-- ── FlowEditor ───────────────────────────────────────────── -->
			<FlowEditor
				bind:this={editor}
				categories={boardCategories}
				embed={isEmbed}
				onchange={handleEditorChange}
				onhelp={openBlockHelp}
			/>

			{#if !isEmbed}
			<!-- ─── Bottom Console Panel ───────────────────────────────────── -->
			{#if activeConsoleTab !== null}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="relative flex min-h-0 shrink-0 flex-col border-t border-gray-700/60 bg-gray-950" style="height: {consoleHeight}px">
					<!-- Resize handle (overlaps the border, no extra height) -->
					<div
						class="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize z-10 transition-colors {isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/20'}"
						onmousedown={startResize}
					></div>
					<!-- Tab bar -->
					<div class="flex items-center border-b border-gray-800 bg-gray-900">
						<button
							onclick={() => activeConsoleTab = 'code'}
							class="flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[11px] transition-colors {activeConsoleTab === 'code' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
						>
							<SquareCode size={13} />C Code
							<span class="rounded bg-blue-900/50 px-1 py-px text-[9px] text-blue-400">live</span>
						</button>
						<button
							onclick={() => activeConsoleTab = 'run'}
							class="flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[11px] transition-colors {activeConsoleTab === 'run' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
						>
							{#if isRunning}
								<span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></span>
							{:else}
								<CirclePlay size={13} />
							{/if}
							Run Console
						</button>
						<button
							onclick={() => activeConsoleTab = 'serial'}
							class="flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[11px] transition-colors {activeConsoleTab === 'serial' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
						>
							<Terminal size={13} />Serial Monitor
							{#if serialConnected}
								<span class="rounded bg-blue-900/50 px-1 py-px text-[9px] text-blue-400">live</span>
							{/if}
						</button>
						<div class="flex-1"></div>
						{#if activeConsoleTab === 'code'}
							<button
								onclick={() => navigator.clipboard.writeText(cCode)}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
								title="Copy"
							>
								<Copy size={12} />Copy
							</button>
						{:else if activeConsoleTab === 'run'}
							<button
								onclick={() => { autoScrollRun = !autoScrollRun; if (autoScrollRun && runLogEl) runLogEl.scrollTop = runLogEl.scrollHeight; }}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors {autoScrollRun ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'}"
								title="Auto scroll"
							>
								<ChevronsDown size={12} />Auto scroll
							</button>
							<button
								onclick={() => runLogs = []}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
								title="Clear"
							>
								<Trash2 size={12} />Clear
							</button>
						{:else if activeConsoleTab === 'serial'}
							<button
								onclick={() => { autoScrollSerial = !autoScrollSerial; if (autoScrollSerial && serialLogEl) serialLogEl.scrollTop = serialLogEl.scrollHeight; }}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors {autoScrollSerial ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'}"
								title="Auto scroll"
							>
								<ChevronsDown size={12} />Auto scroll
							</button>
							<button
								onclick={() => serialLogs = []}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
								title="Clear"
							>
								<Trash2 size={12} />Clear
							</button>
						{/if}
						<button
							onclick={() => activeConsoleTab = null}
							aria-label="Close"
							class="px-2 py-1.5 text-gray-600 transition-colors hover:text-gray-300"
						>
							<X size={14} />
						</button>
					</div>

					<!-- Tab content -->
					{#if activeConsoleTab === 'code'}
						<CodeViewer code={cCode} lang="c" />
					{:else if activeConsoleTab === 'run'}
						{#if runLogs.length === 0}
							<div class="flex flex-1 items-center justify-center gap-2 text-[11px] text-gray-600">
								<CirclePlay size={14} />
								<span>Press <span class="text-gray-400">Run</span> to compile and upload</span>
							</div>
						{:else}
							<pre bind:this={runLogEl} class="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-gray-300">{@html ansiToHtml(runLogs.join(''))}</pre>
						{/if}
					{:else if activeConsoleTab === 'serial'}
						<!-- Serial toolbar -->
						<div class="flex items-center gap-1.5 border-b border-gray-800 bg-gray-950 px-2 py-1.5">
							<input
								bind:value={serialMessage}
								onkeydown={(e) => e.key === 'Enter' && sendSerialMessage()}
								disabled={!serialConnected}
								class="grow rounded border border-gray-700 bg-gray-900 px-1 py-0.5 text-[10px] text-gray-200 focus:border-blue-500 focus:outline-none"
								placeholder={serialConnected ? 'Message (Enter to send message)' : ''}
								style="height:30px;"
							/>
							<div class="w-14 shrink-0">
								<Dropdown
									value={serialLineEnding}
									options={[
										{ label: '-', value: '' },
										{ label: '\\r', value: '\r' },
										{ label: '\\n', value: '\n' },
										{ label: '\\r\\n', value: '\r\n' },
									]}
									onchange={(v) => { serialLineEnding = v; }}
									disabled={!serialConnected}
									placeholder="Line Ending"
									style="height:30px; font-size:10px;"
								/>
							</div>
							<div class="w-20 shrink-0">
								<Dropdown
									value={serialBaudRate}
									options={[300,900,750,1200,2400,4800,9600,19200,31250,38400,57600,74880,115200,230400,250000,460800,500000,921600,1000000,2000000].map(n => ({ value: String(n), label: String(n) }))}
									onchange={(v) => { serialBaudRate = v; }}
									disabled={serialConnected || !agentConnected}
									placeholder="Baud rate"
									style="height:30px; font-size:10px;"
								/>
							</div>
							<button
								onclick={toggleSerialConnect}
								disabled={!agentConnected || !selectedPort || isConnectingSerial}
								class="h-7.5 flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[11px] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 {serialConnected ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'}"
							>
								{#if isConnectingSerial}
									<LoaderCircle size={11} class="animate-spin" />
								{:else if serialConnected}
									<CircleStop size={11} />
								{:else}
									<Usb size={11} />
								{/if}
								{serialConnected ? 'Disconnect' : 'Connect'}
							</button>
						</div>
						<!-- Log area -->
						<pre bind:this={serialLogEl} class="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-gray-300">{serialLogs.join('')}</pre>
					{/if}
				</div>
			{/if}
			{/if}

		</div>
	</div>

	{#if !isEmbed}
	<!-- ─── Status bar ──────────────────────────────────────────────── -->
	<footer class="flex items-center gap-4 border-t border-gray-800 bg-gray-900 px-4 py-1 text-[10px] text-gray-600">
		<span>Block: <span class="text-gray-400">{status?.blockCount ?? 0}</span></span>
		<span>Connection: <span class="text-gray-400">{status?.connCount ?? 0}</span></span>
		<button class="ml-auto text-gray-500 hover:text-gray-400" onclick={() => editor?.zoomReset()}>{Math.round((status?.zoom ?? 1) * 100)}%</button>
		<div class="flex items-center gap-1.5">
			<Usb size={11} class={boardConnected ? 'text-green-500' : 'text-gray-600'} />
			<span class={boardConnected ? 'text-green-400' : 'text-gray-600'}>{selectedBoard.name}</span>
		</div>
		<div class="flex items-center gap-1 {agentConnected ? 'text-green-400' : 'text-gray-600'}">
			{#if agentConnected}
				<Wifi size={11} />
			{:else}
				<WifiOff size={11} />
			{/if}
			<span>Agent</span>
		</div>
		<div class="mx-1 h-3 w-px bg-gray-700"></div>
		<button
			onclick={() => activeConsoleTab = activeConsoleTab !== null ? null : 'code'}
			class="flex items-center gap-1 transition-colors {activeConsoleTab !== null ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 hover:text-gray-400'}"
			title="Toggle Console"
		>
			<SquareCode size={12} />
			<span>Console</span>
		</button>
	</footer>
	{/if}
</div>
