<script lang="ts">
	import { onMount } from 'svelte';
	import FlowEditor, { type FlowEditorEvent } from '$lib/flowcode/FlowEditor.svelte';
	import ConfirmDialog, { type ConfirmOptions } from '$lib/components/ConfirmDialog.svelte';
	import { blockCategories } from '$lib/blocks/index.js';
	import type { BlockDef, CanvasBlock } from '$lib/blocks/types.js';
	import {
		FilePlus, FolderOpen, Save, CirclePlay, SquareCode,
		User, Folder, LogOut, Copy, Terminal,
		Files, Puzzle, CircleQuestionMark
	} from 'lucide-svelte';

	const blockDefMap: Record<string, BlockDef> = Object.fromEntries(
		blockCategories.flatMap((c) => c.blocks).map((b) => [b.id, b])
	);

	type SidePanel = 'files' | 'extensions' | 'help' | null;
	let activePanel = $state<SidePanel>(null);

	function togglePanel(panel: SidePanel) {
		activePanel = activePanel === panel ? null : panel;
	}

	let editor = $state<FlowEditor | null>(null);
	let cCode = $state('');
	let showConsole = $state(false);
	let showUserMenu = $state(false);
	let status = $state<{
		blockCount: number; connCount: number; zoom: number;
	}>();

	let focusedBlock = $state<BlockDef | null>(null);

	function handleEditorChange(event: FlowEditorEvent) {
		status = {
			blockCount: editor!.blockList().length,
			connCount: editor!.connectionList().length,
			zoom: editor!.getZoom(),
		};

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
		const data = editor?.generateCode() || '';
		if ('showSaveFilePicker' in window) {
			try {
				const handle = await (window as any).showSaveFilePicker({
					suggestedName: 'project.ino',
					types: [{ description: 'Arduino Project', accept: { 'text/plain': ['.ino'] } }]
				});
				const writable = await handle.createWritable();
				await writable.write(data);
				await writable.close();
			} catch (e: any) {
				if (e.name !== 'AbortError') console.error(e);
			}
		} else {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
			a.download = 'project.ino';
			a.click();
			URL.revokeObjectURL(a.href);
		}
	}

	// Auto load project from Local Storage
	onMount(() => {
		const saved = localStorage.getItem('flowcode-project');
		if (saved) editor?.importJson(saved);
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

			<!-- Run -->
			<button
				onclick={() => runProject()}
				class="flex items-center gap-1.5 rounded bg-green-700 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-green-600"
			>
				<CirclePlay size={16} />
				<span>รัน</span>
			</button>

			<!-- Toggle C Code Console -->
			<button
				onclick={() => (showConsole = !showConsole)}
				class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors {showConsole ? 'bg-blue-700 text-white hover:bg-blue-600' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
				title="แสดง/ซ่อนโค้ด C"
			>
				<SquareCode size={16} />
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
		<nav class="flex w-12 flex-col items-center gap-1 border-r border-gray-700/60 bg-gray-900 py-2">
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
				onclick={() => { togglePanel('help'); focusedBlock = null; }}
				class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors {activePanel === 'help' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white'}"
				title="วิธีใช้"
			>
				<CircleQuestionMark size={18} />
			</button>
		</nav>

		<!-- ── Side panel ──────────────────────────────────────────── -->
		{#if activePanel}
			<div class="flex w-64 flex-col border-r border-gray-700/60 bg-gray-900">
				<!-- Panel header -->
				<div class="flex items-center justify-between border-b border-gray-700/60 px-4 py-3">
					<span class="text-xs font-semibold uppercase tracking-widest text-gray-400">
						{#if activePanel === 'files'}จัดการไฟล์
						{:else if activePanel === 'extensions'}บล็อกเสริม
						{:else}วิธีใช้
						{/if}
					</span>
					<button onclick={() => activePanel = null} aria-label="ปิด" class="text-gray-600 hover:text-gray-300 transition-colors">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
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
						<p class="mb-3 text-[11px] text-gray-500">ติดตั้งบล็อกเสริมจากไฟล์ <code class="rounded bg-gray-800 px-1">.flowext.js</code></p>
						<button
							onclick={() => {
								const input = document.createElement('input');
								input.type = 'file';
								input.accept = '.js,.flowext.js';
								input.click();
							}}
							class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 px-3 py-4 text-xs text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-400"
						>
							<Puzzle size={16} />
							เลือกไฟล์ Extension
						</button>
					{:else if activePanel === 'help'}
						{#if focusedBlock}
							<!-- Block detail view -->
							<div class="space-y-3 text-xs text-gray-400">
								<div class="flex items-center gap-2">
									<span class="text-lg leading-none">{focusedBlock.icon}</span>
									<span class="font-semibold text-white">{focusedBlock.name}</span>
									<span class="ml-auto rounded bg-gray-700 px-1.5 py-0.5 font-mono text-[9px] text-gray-400">{focusedBlock.category}</span>
								</div>
								{#if focusedBlock.description}
									<p class="leading-relaxed text-gray-300">{focusedBlock.description}</p>
								{/if}
								{#if focusedBlock.inputs.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Inputs</p>
										<ul class="space-y-1.5">
											{#each focusedBlock.inputs as port}
												<li class="flex flex-col gap-0.5">
													<span class="font-medium text-gray-300">{port.label} <span class="font-mono text-[9px] text-gray-500">({port.dataType})</span></span>
													{#if port.description}
														<span class="text-gray-500">{port.description}</span>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if focusedBlock.outputs.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Outputs</p>
										<ul class="space-y-1.5">
											{#each focusedBlock.outputs as port}
												<li class="flex flex-col gap-0.5">
													<span class="font-medium text-gray-300">{port.label} <span class="font-mono text-[9px] text-gray-500">({port.dataType})</span></span>
													{#if port.description}
														<span class="text-gray-500">{port.description}</span>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if focusedBlock.params && focusedBlock.params.length > 0}
									<div>
										<p class="mb-1.5 font-semibold text-gray-400">Parameter</p>
										<ul class="space-y-1.5">
											{#each focusedBlock.params as params}
												<li class="flex flex-col gap-0.5">
													<span class="font-medium text-gray-300">{params.label} <span class="font-mono text-[9px] text-gray-500">({params.type})</span></span>
													{#if params.description}
														<span class="text-gray-500">{params.description}</span>
													{/if}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{:else}
							<!-- General help -->
							<div class="space-y-4 text-xs text-gray-400">
								<p class="text-[11px] text-gray-500">คลิกที่บล็อกบน Canvas เพื่อดูรายละเอียด</p>
								<div>
									<p class="mb-1.5 font-semibold text-gray-300">การใช้งานพื้นฐาน</p>
									<ul class="space-y-1.5 leading-relaxed">
										<li>• ลากบล็อกจากแผง <span class="text-white">Blocks</span> มาวางบน Canvas</li>
										<li>• คลิกที่พอร์ต Output แล้วลากไปยังพอร์ต Input เพื่อเชื่อมต่อ</li>
										<li>• คลิกที่บล็อกเพื่อเลือก กด <kbd class="rounded bg-gray-700 px-1 font-mono">Del</kbd> เพื่อลบ</li>
										<li>• คลิกขวาที่บล็อกเพื่อดูเมนูเพิ่มเติม</li>
									</ul>
								</div>
								<div>
									<p class="mb-1.5 font-semibold text-gray-300">Viewport</p>
									<ul class="space-y-1.5 leading-relaxed">
										<li>• เลื่อนล้อเมาส์เพื่อซูม</li>
										<li>• ลากพื้นที่ว่างเพื่อเลื่อน Canvas</li>
										<li>• กดปุ่ม Focus เพื่อให้แสดงบล็อกทั้งหมด</li>
									</ul>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		<!-- ── FlowEditor ───────────────────────────────────────────── -->
		<FlowEditor
			bind:this={editor}
			onchange={handleEditorChange}
			onhelp={(blockInfo: BlockDef) => { focusedBlock = blockInfo; activePanel = 'help'; }}
		/>
	</div>

	<!-- ─── C Code Console ──────────────────────────────────────────── -->
	{#if showConsole}
		<div class="flex h-52 flex-col border-t border-gray-700/60 bg-gray-950">
			<div class="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-1.5">
				<div class="flex items-center gap-2">
					<Terminal size={14} class="text-blue-400" />
					<span class="text-[11px] font-semibold text-gray-400">C Code Output</span>
					<span class="rounded bg-blue-900/50 px-1.5 py-0.5 text-[9px] text-blue-400">live</span>
				</div>
				<button
					onclick={() => navigator.clipboard.writeText(cCode)}
					class="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
					title="คัดลอกโค้ด"
				>
					<Copy size={12} />
					คัดลอก
				</button>
			</div>
			<pre class="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 text-green-300">{cCode}</pre>
		</div>
	{/if}

	<!-- ─── Status bar ──────────────────────────────────────────────── -->
	<footer class="flex items-center gap-4 border-t border-gray-800 bg-gray-900 px-4 py-1 text-[10px] text-gray-600">
		<span>บล็อก: <span class="text-gray-400">{status?.blockCount ?? 0}</span></span>
		<span>การเชื่อมต่อ: <span class="text-gray-400">{status?.connCount ?? 0}</span></span>
		<span class="ml-auto text-gray-500">{Math.round((status?.zoom ?? 1) * 100)}%</span>
	</footer>
</div>
