<script lang="ts">
	import { onMount } from 'svelte';
	import FlowEditor, { type FlowEditorEvent } from '$lib/flowcode/FlowEditor.svelte';
	import ConfirmDialog, { type ConfirmOptions } from '$lib/components/ConfirmDialog.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import boards from '$lib/boards/index.js';
	import type { BlockCategory, BlockDef } from '$lib/blocks/types.js';
	import { FlowcodeAgentClient } from '$lib/agent-client/index.js';
	import {
		FilePlus, FolderOpen, Save, CirclePlay, SquareCode,
		User, Folder, LogOut, Copy, Terminal,
		Files, Puzzle, CircleQuestionMark,
		ArrowLeft, X, Download, Trash2, CircleCheck,
		Cpu, Usb, Wifi, WifiOff, ChevronsDown,
	} from 'lucide-svelte';

	import type { ExtensionProps } from '$lib/blocks/extension/types';
	import extensionIndex from '$lib/blocks/extension';

	type ExtensionItem = ExtensionProps & {
		installed: boolean;
	};

	let extensions = $state<ExtensionItem[]>(extensionIndex.map((e) => ({ ...e, installed: false })));

	let selectedBoard = $state(boards[0]);
	let boardConnected = $state(false);

	// ─── FlowcodeAgent (shared instance) ────────────────────────────
	const agent = new FlowcodeAgentClient('ws://localhost:8080');
	let agentConnected = $state(false);
	const installedCores = new Set<string>(); // track installed cores to skip re-install
	let availablePorts = $state<string[]>([]);
	let selectedPort = $state('');

	agent.onConnect = () => { agentConnected = true; };
	agent.onDisconnect = () => { agentConnected = false; };

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
		if ((editor?.blockList().length ?? 0) > 0) {
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
		} else {
			selectedBoard = next;
		}
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
	let isRunning = $state(false);
	type ConsoleTab = 'code' | 'run' | 'serial';
	let activeConsoleTab = $state<ConsoleTab | null>(null);
	let autoScrollRun = $state(true);
	let autoScrollSerial = $state(true);
	let runLogEl = $state<HTMLPreElement | null>(null);
	let serialLogEl = $state<HTMLPreElement | null>(null);

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

	function handleEditorChange(event: FlowEditorEvent) {
		status = {
			blockCount: editor!.blockList().length,
			connCount: editor!.connectionList().length,
			zoom: editor!.getZoom(),
		};

		/*if (event === 'zoom' || event === 'block:focus' || event === 'block:blur'
			|| event === 'conn:focus' || event === 'conn:blur' || event === 'block:move') return;*/

		// Save to Local Storage
		const json = editor!.exportJson();
		localStorage.setItem('flowcode-project', json);

		cCode = editor?.generateCode() || '';
	}
	
	let confirmDialogOpen = $state(false);
	let confirmDialogOption = $state<ConfirmOptions>({});

	function newProject() {
		confirmDialogOption = {
			title: 'สร้างโปรเจคใหม่',
			message: 'บล็อกและการเชื่อมต่อทั้งหมดจะถูกล้าง ยืนยันหรือไม่?',
			confirmLabel: 'สร้างใหม่',
			onconfirm: () => editor?.clear(),
		};
		confirmDialogOpen = true;
	}

	async function saveProject() {
		const data = editor?.exportJson() || '';
		if ('showSaveFilePicker' in window) {
			try {
				const handle = await (window as any).showSaveFilePicker({
					suggestedName: 'project.json',
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
			a.download = 'project.json';
			a.click();
			URL.revokeObjectURL(a.href);
		}
	}

	async function openProject() {
		if ('showOpenFilePicker' in window) {
			try {
				const [handle] = await (window as any).showOpenFilePicker({
					types: [{ description: 'FlowCode Project', accept: { 'application/json': ['.json'] } }]
				});
				const file = await handle.getFile();
				editor?.importJson(await file.text());
			} catch (e: any) {
				if (e.name !== 'AbortError') console.error(e);
			}
		} else {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json,application/json';
			input.onchange = async () => {
				const file = input.files?.[0];
				if (file) editor?.importJson(await file.text());
			};
			input.click();
		}
	}

	async function runProject() {
		if (isRunning) return;
		isRunning = true;
		runLogs = [];
		activeConsoleTab = 'run';

		const log = (msg: string) => { runLogs = [...runLogs, msg]; };

		const sketchName = 'flowcode_project';
		const code = editor?.generateCode() || '';
		const board = selectedBoard;
		const installedDeps = extensions
			.filter((e) => e.installed && Array.isArray(e.depends))
			.flatMap((e) => e.depends as string[]);

		try {
			if (!agentConnected) {
				throw new Error('ไม่สามารถเชื่อมต่อ FlowcodeAgent ได้ กรุณารอสักครู่แล้วลองใหม่');
			}
			agent.onStream = (p) => { runLogs = [...runLogs, p.data]; };

			// 1. Install core (ครั้งแรกเท่านั้น)
			const coreKey = `${board.platform.id}@${board.platform.version}`;
			if (!installedCores.has(coreKey)) {
				log(`📦 ติดตั้ง core: ${coreKey}`);
				await agent.installCore(board.platform.id, board.platform.version, board.platform.package);
				installedCores.add(coreKey);
				log('✅ ติดตั้ง core สำเร็จ');
			} else {
				log(`⏭ ข้าม core (ติดตั้งแล้ว): ${coreKey}`);
			}

			// 2. Install libraries
			const allDeps = [...(board.depends ?? []), ...installedDeps];
			if (allDeps.length > 0) {
				log(`📚 ติดตั้ง library: ${allDeps.join(', ')}`);
				await agent.installLibrary(allDeps);
				log('✅ ติดตั้ง library สำเร็จ');
			}

			// 3. Write sketch
			log(`📝 เขียน sketch: ${sketchName}`);
			await agent.writeSketch(sketchName, code);
			log('✅ เขียน sketch สำเร็จ');

			// 4. Compile
			log(`🔨 กำลัง compile (${board.fqbn})...`);
			await agent.compile(sketchName, board.fqbn);
			log('✅ Compile สำเร็จ');

			// 5. Upload
			if (!selectedPort) throw new Error('กรุณาเลือก Port ก่อน Upload');
			log(`🚀 กำลัง upload ไปที่ ${selectedPort}...`);
			await agent.upload(sketchName, board.fqbn, selectedPort);
			log('✅ Upload สำเร็จ');

		} catch (e: any) {
			log(`❌ เกิดข้อผิดพลาด: ${e?.message ?? String(e)}`);
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

	// Auto load project from Local Storage
	onMount(() => {
		// Load board select from local storage
		const selectedBoardId = localStorage.getItem('board-select');
		if (selectedBoardId) { 
			const next = boards.find((b) => b.id === selectedBoardId);
			if (next) {
				selectedBoard = next;
			}
		}

		// Restore installed extensions
		const savedExtIds = localStorage.getItem('installed-extensions');
		if (savedExtIds) {
			const ids = new Set(JSON.parse(savedExtIds) as string[]);
			extensions = extensions.map((e) => ({ ...e, installed: ids.has(e.id) }));
		}

		// Load flow from local storage
		const saved = localStorage.getItem('flowcode-project');
		if (saved) editor?.importJson(saved);

		const savedTab = localStorage.getItem('console-tab');
		activeConsoleTab = (savedTab === 'code' || savedTab === 'run' || savedTab === 'serial') ? savedTab : null;

		const savedPanel = localStorage.getItem('side-panel') as SidePanel;
		activePanel = savedPanel ?? null;

		// Connect FlowcodeAgent on startup with auto-reconnect
		agent.onPortData = (p) => { serialLogs = [...serialLogs, String(p.data)]; };
		agent.start();
	});

	$effect(() => {
		localStorage.setItem('console-tab', activeConsoleTab ?? '');
	});

	$effect(() => {
		const ids = extensions.filter((e) => e.installed).map((e) => e.id);
		localStorage.setItem('installed-extensions', JSON.stringify(ids));
	});

	$effect(() => {
		localStorage.setItem('side-panel', activePanel ?? '');
	});

	$effect(() => {
		localStorage.setItem('board-select', selectedBoard.id);
	});
</script>

<ConfirmDialog
	bind:open={confirmDialogOpen}
	{...confirmDialogOption}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white"
	onclick={() => { showUserMenu = false; }}
	onkeydown={(e) => { if (e.key === 'Escape') showUserMenu = false; }}
>
	<!-- ─── Top Navbar ──────────────────────────────────────────────── -->
	<header class="z-20 flex items-center justify-between border-b border-gray-700/60 bg-gray-900 px-4 py-2 shadow-lg">
		<div class="flex items-center gap-1">
			<span class="mr-3 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-base font-bold text-transparent">
				FlowCode
			</span>

			<!-- New Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="สร้างโปรเจคใหม่"
				onclick={() => newProject()}
			>
				<FilePlus size={16} />
				<span class="hidden sm:inline">สร้างโปรเจคใหม่</span>
			</button>

			<!-- Open Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="เปิดโปรเจค"
				onclick={() => openProject()}
			>
				<FolderOpen size={16} />
				<span class="hidden sm:inline">เปิดโปรเจค</span>
			</button>

			<!-- Save Project -->
			<button
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				title="บันทึกโปรเจค"
				onclick={() => saveProject()}
			>
				<Save size={16} />
				<span class="hidden sm:inline">บันทึก</span>
			</button>

			<div class="mx-1 h-5 w-px bg-gray-700"></div>

			<!-- Board selector -->
			<div class="flex items-center gap-1.5 w-40 px-1">
				<Cpu size={13} class="shrink-0 text-gray-500" />
				<Dropdown
					value={selectedBoard.id}
					options={boards.map((b) => ({ value: b.id, label: b.name }))}
					onchange={(v) => changeBoard(v)}
					placeholder="เลือกบอร์ด"
					style="font-size:12px; padding: 3px 8px;"
				/>
			</div>

			<!-- Port selector -->
			<div class="flex items-center gap-1.5 w-36 px-1">
				<Usb size={13} class="shrink-0 {agentConnected ? 'text-gray-400' : 'text-gray-600'}" />
				<Dropdown
					value={selectedPort}
					loadOptions={refreshPorts}
					onchange={(v) => selectedPort = v}
					disabled={!agentConnected}
					placeholder="เลือกพอร์ต"
					emptyText="ไม่พบพอร์ต USB"
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
				<span>{isRunning ? 'กำลังรัน...' : 'รัน'}</span>
			</button>

		</div>

		<!-- User Avatar -->
		<div class="relative">
			<button
				onclick={(e) => { e.stopPropagation(); showUserMenu = !showUserMenu; }}
				class="h-8 w-8 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500"
				aria-label="เมนูผู้ใช้"
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
							ข้อมูลส่วนตัว
						</button>
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
							<Folder size={16} class="text-gray-400" />
							โปรเจคของฉัน
						</button>
					</div>
					<div class="border-t border-gray-700 py-1">
						<button class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-gray-700/50 hover:text-red-300">
							<LogOut size={16} />
							ออกจากระบบ
						</button>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<!-- ─── Main area (sidebar + editor) ──────────────────────────── -->
	<div class="flex flex-1 overflow-hidden">

		<!-- ── Icon rail ───────────────────────────────────────────── -->
		<nav class="flex w-12 flex-col shrink-0 items-center gap-1 border-r border-gray-700/60 bg-gray-900 py-2">
			<button
				onclick={() => togglePanel('files')}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'files' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="จัดการไฟล์"
			>
				<Files size={18} />
			</button>
			<button
				onclick={() => togglePanel('extensions')}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'extensions' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="ติดตั้งบล็อกเสริม"
			>
				<Puzzle size={18} />
			</button>
			<div class="flex-1"></div>
			<button
				onclick={() => { togglePanel('help'); helpBlockDef = null; }}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'help' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="วิธีใช้"
			>
				<CircleQuestionMark size={18} />
			</button>
		</nav>

		<!-- ── Side panel ──────────────────────────────────────────── -->
		{#if activePanel}
			<div class="flex w-64 flex-col shrink-0 border-r border-gray-700/60 bg-gray-900">
				<!-- Panel header -->
				<div class="flex items-center justify-between border-b border-gray-700/60 px-4 py-3">
					<div class="flex gap-2">
						{#if activePanel === 'help' && helpBlockDef}
							<button onclick={() => helpBlockDef = null} aria-label="กลับ" class="text-gray-600 hover:text-gray-300 transition-colors">
								<ArrowLeft size={16} />
							</button>
						{/if}
						<span class="text-xs font-semibold uppercase tracking-widest text-gray-400">
							{#if activePanel === 'files'}จัดการไฟล์
							{:else if activePanel === 'extensions'}บล็อกเสริม
							{:else if activePanel === 'help'}วิธีใช้
							{/if}
						</span>
					</div>
					<button onclick={() => activePanel = null} aria-label="ปิด" class="text-gray-600 hover:text-gray-300 transition-colors">
						<X size={16} />
					</button>
				</div>

				<!-- Panel content -->
				<div class="flex-1 overflow-y-auto p-3">
					{#if activePanel === 'files'}
						<div class="space-y-1">
							<button onclick={newProject} class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
								<FilePlus size={15} class="shrink-0 text-gray-500" />สร้างโปรเจคใหม่
							</button>
							<button onclick={openProject} class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
								<FolderOpen size={15} class="shrink-0 text-gray-500" />เปิดโปรเจค
							</button>
							<button onclick={saveProject} class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
								<Save size={15} class="shrink-0 text-gray-500" />บันทึกโปรเจค
							</button>
							<button onclick={runProject} class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
								<CirclePlay size={15} class="shrink-0 text-gray-500" />ส่งออก .ino
							</button>
						</div>
					{:else if activePanel === 'extensions'}
						<div class="space-y-2">
							<p class="mb-3 text-[11px] text-gray-500">ติดตั้งแล้ว</p>
							{#each extensions.filter(a => a.installed) as ext}
								<div class="rounded-lg border border-gray-700/60 bg-gray-800/40 px-3 py-2.5 text-xs">
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-1.5">
												<span class="font-semibold text-gray-200">{ext.name}</span>
												<span class="rounded bg-gray-700 px-1 py-px font-mono text-[9px] text-gray-500">v{ext.version}</span>
												{#if ext.installed}
													<CircleCheck size={11} class="ml-auto shrink-0 text-green-500" />
												{/if}
											</div>
											<p class="mt-0.5 text-[10px] text-gray-500">โดย {ext.author}</p>
											<p class="mt-1 leading-snug text-gray-400">{ext.description}</p>
										</div>
									</div>
									<div class="mt-2.5 flex justify-end">
										{#if ext.installed}
											<button
												onclick={() => ext.installed = false}
												class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
											>
												<Trash2 size={11} />ถอนติดตั้ง
											</button>
										{:else}
											<button
												onclick={() => ext.installed = true}
												class="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[10px] text-blue-400 transition-colors hover:bg-blue-600/40 hover:text-blue-300"
											>
												<Download size={11} />ติดตั้ง
											</button>
										{/if}
									</div>
								</div>
							{/each}
							<hr class="border-gray-700/60" />
							<p class="mb-3 text-[11px] text-gray-500">ยังไม่ติดตั้ง</p>
							{#each extensions.filter(a => !a.installed) as ext}
								<div class="rounded-lg border border-gray-700/60 bg-gray-800/40 px-3 py-2.5 text-xs">
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-1.5">
												<span class="font-semibold text-gray-200">{ext.name}</span>
												<span class="rounded bg-gray-700 px-1 py-px font-mono text-[9px] text-gray-500">v{ext.version}</span>
												{#if ext.installed}
													<CircleCheck size={11} class="ml-auto shrink-0 text-green-500" />
												{/if}
											</div>
											<p class="mt-0.5 text-[10px] text-gray-500">โดย {ext.author}</p>
											<p class="mt-1 leading-snug text-gray-400">{ext.description}</p>
										</div>
									</div>
									<div class="mt-2.5 flex justify-end">
										{#if ext.installed}
											<button
												onclick={() => ext.installed = false}
												class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
											>
												<Trash2 size={11} />ถอนติดตั้ง
											</button>
										{:else}
											<button
												onclick={() => ext.installed = true}
												class="flex items-center gap-1 rounded bg-blue-600/20 px-2 py-1 text-[10px] text-blue-400 transition-colors hover:bg-blue-600/40 hover:text-blue-300"
											>
												<Download size={11} />ติดตั้ง
											</button>
										{/if}
									</div>
								</div>
							{/each}
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
									<p class="mb-1.5 font-semibold text-gray-300">การใช้งานพื้นฐาน</p>
									<ul class="space-y-1 leading-relaxed">
										<li>• ลากบล็อกจากแผง <span class="text-white">Blocks</span> มาวางบน Canvas</li>
										<li>• คลิกพอร์ต Output ลากไปพอร์ต Input เพื่อเชื่อมต่อ</li>
										<li>• คลิกบล็อกเพื่อเลือก กด <kbd class="rounded bg-gray-700 px-1 font-mono">Del</kbd> เพื่อลบ</li>
										<li>• คลิกขวาที่บล็อก → วิธีใช้ เพื่อดูรายละเอียด</li>
										<li>• เลื่อนล้อเมาส์เพื่อซูม ลากพื้นที่ว่างเพื่อเลื่อน Canvas</li>
									</ul>
								</div>

								<hr class="border-gray-700/60" />

								<div>
									<p class="mb-2 font-semibold text-gray-300">บล็อกทั้งหมด</p>
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
																<span class="shrink-0 text-[9px] text-gray-600">›</span>
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
		
		<div class="flex min-h-0 min-w-0 flex-col grow">
			<!-- ── FlowEditor ───────────────────────────────────────────── -->
			<FlowEditor
				bind:this={editor}
				categories={boardCategories}
				onchange={handleEditorChange}
				onhelp={openBlockHelp}
			/>

			<!-- ─── Bottom Console Panel ───────────────────────────────────── -->
			{#if activeConsoleTab !== null}
				<div class="flex h-52 min-h-0 shrink-0 flex-col border-t border-gray-700/60 bg-gray-950">
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
						</button>
						<div class="flex-1"></div>
						{#if activeConsoleTab === 'code'}
							<button
								onclick={() => navigator.clipboard.writeText(cCode)}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
								title="คัดลอกโค้ด"
							>
								<Copy size={12} />คัดลอก
							</button>
						{:else if activeConsoleTab === 'run'}
							<button
								onclick={() => { autoScrollRun = !autoScrollRun; if (autoScrollRun && runLogEl) runLogEl.scrollTop = runLogEl.scrollHeight; }}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors {autoScrollRun ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'}"
								title="Auto scroll"
							>
								<ChevronsDown size={12} />Auto scroll
							</button>
						{:else if activeConsoleTab === 'serial'}
							<button
								onclick={() => { autoScrollSerial = !autoScrollSerial; if (autoScrollSerial && serialLogEl) serialLogEl.scrollTop = serialLogEl.scrollHeight; }}
								class="flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors {autoScrollSerial ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'}"
								title="Auto scroll"
							>
								<ChevronsDown size={12} />Auto scroll
							</button>
						{/if}
						<button
							onclick={() => activeConsoleTab = null}
							aria-label="ปิด"
							class="px-2 py-1.5 text-gray-600 transition-colors hover:text-gray-300"
						>
							<X size={14} />
						</button>
					</div>

					<!-- Tab content -->
					{#if activeConsoleTab === 'code'}
						<pre class="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-green-300">{cCode}</pre>
					{:else if activeConsoleTab === 'run'}
						{#if runLogs.length === 0}
							<div class="flex flex-1 items-center justify-center gap-2 text-[11px] text-gray-600">
								<CirclePlay size={14} />
								<span>กด <span class="text-gray-400">รัน</span> เพื่อเริ่มการ compile และ upload</span>
							</div>
						{:else}
							<pre bind:this={runLogEl} class="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-gray-300">{runLogs.join('\n')}</pre>
						{/if}
					{:else if activeConsoleTab === 'serial'}
						{#if serialLogs.length === 0}
							<div class="flex flex-1 items-center justify-center gap-2 text-[11px] text-gray-600">
								<Terminal size={14} />
								<span>เชื่อมต่อบอร์ดผ่าน USB เพื่อเปิด Serial Monitor</span>
							</div>
						{:else}
							<pre bind:this={serialLogEl} class="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-gray-300">{serialLogs.join('\n')}</pre>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- ─── Status bar ──────────────────────────────────────────────── -->
	<footer class="flex items-center gap-4 border-t border-gray-800 bg-gray-900 px-4 py-1 text-[10px] text-gray-600">
		<span>บล็อก: <span class="text-gray-400">{status?.blockCount ?? 0}</span></span>
		<span>การเชื่อมต่อ: <span class="text-gray-400">{status?.connCount ?? 0}</span></span>
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
			title="แสดง/ซ่อน Console"
		>
			<SquareCode size={12} />
			<span>Console</span>
		</button>
	</footer>
</div>
