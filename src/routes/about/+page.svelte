<script lang="ts">
	import {
		Workflow, Zap, Code2, Upload, Terminal, Share2,
		Puzzle, Layers, Cpu, Wifi, Globe, Database,
		ArrowRight, GitBranch, Radio, Activity,
		ChevronRight, FileCode, Package, MonitorSmartphone, ChevronsDown,
	} from 'lucide-svelte';
	import { assets } from '$app/paths';
	import extensionIndex from '$lib/blocks/extension';

	const EXTENSIONS_INITIAL = 8;
	let showAllExtensions = $state(false);
	const visibleExtensions = $derived(
		showAllExtensions ? extensionIndex : extensionIndex.slice(0, EXTENSIONS_INITIAL)
	);

	const features = [
		{
			icon: Workflow,
			title: 'Visual Flow Programming',
			desc: 'Build firmware logic by connecting blocks — no syntax errors, no blank screen. The canvas stays out of your way.',
			color: 'text-blue-400',
			bg: 'bg-blue-500/10',
			border: 'border-blue-500/20',
		},
		{
			icon: Code2,
			title: 'Instant C Code Generation',
			desc: 'Every block compiles down to clean, readable C/C++ in real-time. See the output as you build — no magic, no lock-in.',
			color: 'text-emerald-400',
			bg: 'bg-emerald-500/10',
			border: 'border-emerald-500/20',
		},
		{
			icon: Upload,
			title: 'One-Click Upload',
			desc: 'Connect the FlowCode Agent and push firmware straight to your board — compile, upload, and monitor without leaving the browser.',
			color: 'text-violet-400',
			bg: 'bg-violet-500/10',
			border: 'border-violet-500/20',
		},
		{
			icon: Terminal,
			title: 'Built-in Serial Monitor',
			desc: 'Read live output from your ESP32 right inside the editor. Send commands, watch values update, debug in real-time.',
			color: 'text-orange-400',
			bg: 'bg-orange-500/10',
			border: 'border-orange-500/20',
		},
		{
			icon: Layers,
			title: 'Multi-File Projects',
			desc: 'Split complex logic across multiple .flow files. All files are merged before code generation — keeping things organised.',
			color: 'text-sky-400',
			bg: 'bg-sky-500/10',
			border: 'border-sky-500/20',
		},
		{
			icon: Share2,
			title: 'Share & Embed',
			desc: 'Generate a URL that encodes your entire project — all files, settings, and extensions — ready to share or embed in a page.',
			color: 'text-pink-400',
			bg: 'bg-pink-500/10',
			border: 'border-pink-500/20',
		},
	];

	const categories = [
		{ label: 'Trigger', icon: Zap, color: 'text-yellow-400' },
		{ label: 'I/O', icon: Activity, color: 'text-green-400' },
		{ label: 'Control', icon: GitBranch, color: 'text-blue-400' },
		{ label: 'Variable', icon: Database, color: 'text-purple-400' },
		{ label: 'Function', icon: FileCode, color: 'text-pink-400' },
		{ label: 'WiFi', icon: Wifi, color: 'text-sky-400' },
		{ label: 'HTTP', icon: Globe, color: 'text-orange-400' },
		{ label: 'ESP-NOW', icon: Radio, color: 'text-emerald-400' },
		{ label: 'Serial', icon: Terminal, color: 'text-red-400' },
		{ label: 'I2C / SPI', icon: Cpu, color: 'text-violet-400' },
		{ label: 'Storage', icon: Database, color: 'text-amber-400' },
		{ label: 'Webserver', icon: Globe, color: 'text-teal-400' },
	];

	const steps = [
		{
			n: '01',
			title: 'Pick your board',
			desc: 'Select an ESP32 variant from the board list. FlowCode adjusts available blocks and FQBN automatically.',
		},
		{
			n: '02',
			title: 'Drag & connect blocks',
			desc: 'Pull blocks from the palette onto the canvas, wire ports together, and configure params inline.',
		},
		{
			n: '03',
			title: 'Generate & upload',
			desc: 'Click Generate to see the C code, then Upload to flash your board — all in one browser tab.',
		},
	];
</script>

<svelte:head>
	<title>About — FlowCode</title>
	<meta name="description" content="FlowCode is a visual flow-based firmware builder for ESP32 and Arduino, running entirely in the browser." />
</svelte:head>

<!-- ─── Nav ──────────────────────────────────────────────────────── -->
<nav class="fixed top-0 z-50 w-full border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-md">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
		<a href="/" class="flex items-center gap-2 text-sm font-semibold text-gray-100 hover:text-white transition-colors">
			<img src="{assets}/favicon.png" alt="FlowCode" class="h-5 w-5" />
			FlowCode
		</a>
		<a
			href="/"
			class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
		>
			Open Editor
			<ArrowRight size={13} />
		</a>
	</div>
</nav>

<main class="min-h-screen bg-gray-900 text-gray-200">

	<!-- ─── Hero ─────────────────────────────────────────────────── -->
	<section class="relative overflow-hidden pb-24 pt-32">
		<!-- grid pattern background -->
		<div
			class="pointer-events-none absolute inset-0"
			style="background-image: linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px); background-size: 48px 48px;"
		></div>
		<!-- glow -->
		<div class="pointer-events-none absolute left-1/2 top-0 h-96 w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl"></div>

		<div class="relative mx-auto max-w-4xl px-6 text-center">
			<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
				<Cpu size={11} />
				Visual firmware builder for ESP32 &amp; Arduino
			</div>

			<h1 class="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
				Build firmware
				<br />
				<span class="hero-gradient">without writing code</span>
			</h1>

			<p class="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400">
				FlowCode turns hardware logic into a visual graph. Connect blocks, configure parameters,
				and get clean C/C++ code — then push it straight to your board from the browser.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3">
				<a
					href="/"
					class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all hover:-translate-y-0.5"
				>
					Open Editor
					<ArrowRight size={16} />
				</a>
				<a
					href="https://github.com/ArtronShop/flowcode-agent/releases"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-600 hover:text-white transition-all hover:-translate-y-0.5"
				>
					<MonitorSmartphone size={15} />
					Download Agent
				</a>
			</div>
		</div>
	</section>

	<!-- ─── Features ─────────────────────────────────────────────── -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<h2 class="mb-3 text-3xl font-bold text-white">Everything in one place</h2>
				<p class="text-gray-400">From blank canvas to flashed firmware — no IDE required.</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as f}
					{@const Icon = f.icon}
					<div class="group rounded-2xl border {f.border} {f.bg} p-6 transition-all hover:border-opacity-40 hover:shadow-lg hover:-translate-y-0.5">
						<div class="mb-4 inline-flex rounded-xl border {f.border} {f.bg} p-2.5">
							<Icon size={20} class={f.color} />
						</div>
						<h3 class="mb-2 text-base font-semibold text-white">{f.title}</h3>
						<p class="text-sm leading-relaxed text-gray-400">{f.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ─── How it works ─────────────────────────────────────────── -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<h2 class="mb-3 text-3xl font-bold text-white">How it works</h2>
				<p class="text-gray-400">Three steps from idea to running hardware.</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				{#each steps as s, i}
					<div class="relative rounded-2xl border border-gray-700/60 bg-gray-800/50 p-7">
						<!-- connector line -->
						{#if i < steps.length - 1}
							<div class="absolute right-0 top-1/2 hidden h-px w-6 translate-x-full bg-gradient-to-r from-gray-700 to-transparent md:block"></div>
						{/if}

						<div class="mb-5 text-4xl font-black tracking-tighter text-gray-700">{s.n}</div>
						<h3 class="mb-2 text-base font-semibold text-white">{s.title}</h3>
						<p class="text-sm leading-relaxed text-gray-400">{s.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ─── Block categories ─────────────────────────────────────── -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<h2 class="mb-3 text-3xl font-bold text-white">Block library</h2>
				<p class="text-gray-400">18 built-in categories covering the full ESP32 peripheral set.</p>
			</div>

			<div class="flex flex-wrap justify-center gap-3">
				{#each categories as cat}
					{@const CatIcon = cat.icon}
					<div class="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 transition-colors">
						<CatIcon size={13} class={cat.color} />
						{cat.label}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ─── Flow preview ────────────────────────────────────────── -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-8 text-center">
				<h2 class="mb-3 text-3xl font-bold text-white">See it in action</h2>
				<p class="text-gray-400">A real FlowCode project — pan &amp; zoom to explore the blocks.</p>
			</div>
			<div class="overflow-hidden rounded-2xl border border-gray-700">
				<iframe
					src="/?open=7Vhva9NAHP4q4Xwn2UjSJunyUkTpC7HoBMWMcU2v8zS9C8m1bpaCU2GKL_bGP0xFURmCIuhEvX6bwy-gH0Hu0q5pl9jWCaIMSnv5_Z775Zcnzz3JtQs6wLN0UKcwbgAPYLqOkqhkAR2gdYZIgilJgHd5RQdNHCI57AIskU3TdZds2664JaMs8QS2EPBAC2Ky2AzpdaCDqwklwANdn2iaDwJIOjA5EdLgWuIDT7ssw5rWTX8kAjdk3Ad1iVmwfKCPcmwjQtVBnpLVOqVsPB_jtTUUSwCL2yiTkY2l884S7cTkvICGNE7TxywrsG00lsYBJWn226MvY5l1GS5bRia0IUOVbASTqM3Sq13JhGmb7ceH0QwT42zQdrbjERv72SgHEMI6CgeNP392IN2ADC7v1-hQea5JCEqCGEcMDwkQ_K3ge4K_EnxX8E-CPxD8o-BPBN9U8deCP1bxLXW4I_gjBXgg-ncEf-qDUf3ecJglJYIxbClOur3s7aNs0OawwjBbqJxSoXIiTFZbtIGKpNOEYZKvnRom2pnJmVnxlOoVq-kUiOfHi-2v3_n2QQE5swtoqlAw-YVOVKHDyQSSjVlU8nooi3nlclcNNhVmV_S3BH-vDjdF_64a7wj-Tn737wm-N6YnfSo50eHYqeVMH2cHk4MFcth5J_jLAS_9m4qaW-qzp52uVc9OXST_rHPIW7g1vyYeDu69shA18aPKTkjkt51mhBxIRPZrj12SD1LHUE-QC8u1C8ujExzSqOxCo2rgNcxguLrvTfP61cm0gLacU2AO23rYn9W2rCPfOvIt7ci3_q5v_SFjcgqNKQmuoEY7LHyDKnz5Pp83MetEpgNLZVj09r39Yaa370IX-i_EOJ8GHwv-WckwdbYdwe8rC_ok-reVHW0Odbor-AcFey8LyvX9RgX3fleSmDAUd-CAAlM7rpmGYUw8VoN2wmhrAFHpGdUrf9ImpIIIQYGkacqmUgIXymMiasa0pfaj1V9sPCWoRmNWzdWDDxjNKTGxA6HZAnK1Tl2Gqlt3lm6dw3drz9ZtlvYOjOXSPofWcMLijXTX5pMe0EEHo-sRjRnwuuAGpS3gmYt2pWy4hrvklB3DdF0dRJBcBN5CybAWnYpZNu0la8kySrbKXALeguMsupbtOCXXTAG93ooOYMBwB53CIarm_AnR-wk&embed"
					width="100%"
					height="600"
					style="border:none; display:block;"
					allow="serial"
					title="FlowCode — LED Blink example"
				></iframe>
			</div>
		</div>
	</section>

	<!-- ─── Extensions ───────────────────────────────────────────── -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<h2 class="mb-3 text-3xl font-bold text-white">Extension ecosystem</h2>
				<p class="text-gray-400">
					{extensionIndex.length} sensor &amp; protocol packs — install with one click inside the editor.
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each visibleExtensions as ext (ext.id)}
					<div class="flex flex-col gap-1.5 rounded-xl border border-gray-700/60 bg-gray-800/50 px-4 py-3 hover:border-gray-600 transition-colors">
						<div class="flex items-center gap-2">
							<Package size={11} class="shrink-0 text-gray-500" />
							<span class="truncate text-xs font-semibold text-gray-200">{ext.name}</span>
						</div>
						<p class="line-clamp-2 text-[11px] leading-relaxed text-gray-500">{ext.description}</p>
					</div>
				{/each}
			</div>

			{#if !showAllExtensions}
				<div class="mt-6 flex justify-center">
					<button
						onclick={() => showAllExtensions = true}
						class="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-all"
					>
						<ChevronsDown size={14} />
						See all {extensionIndex.length} extensions
					</button>
				</div>
			{/if}
		</div>
	</section>

	<!-- ─── CTA ──────────────────────────────────────────────────── -->
	<section class="py-24">
		<div class="mx-auto max-w-2xl px-6 text-center">
			<div class="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-transparent px-8 py-14">
				<h2 class="mb-4 text-4xl font-bold text-white">Ready to build?</h2>
				<p class="mb-8 text-gray-400">No install, no signup. Open the editor and start connecting blocks.</p>
				<a
					href="/"
					class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all hover:-translate-y-0.5"
				>
					Open FlowCode Editor
					<ChevronRight size={16} />
				</a>
			</div>
		</div>
	</section>

	<!-- ─── Footer ───────────────────────────────────────────────── -->
	<footer class="border-t border-gray-800 py-8">
		<div class="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-gray-600">
			<span class="flex items-center gap-1.5">
				<img src="{assets}/favicon.png" alt="" class="h-4 w-4 opacity-40" />
				FlowCode — Visual firmware builder
			</span>
			<a href="/" class="hover:text-gray-400 transition-colors flex items-center gap-1">
				Open Editor <ArrowRight size={11} />
			</a>
		</div>
	</footer>

</main>

<style>
	.hero-gradient {
		background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
</style>
