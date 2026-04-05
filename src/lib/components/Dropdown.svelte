<script lang="ts">
	import { tick } from 'svelte';
	import { ChevronDown, Loader } from 'lucide-svelte';

	export interface DropdownOption {
		value: string;
		label: string;
	}

	interface Props {
		value?: string;
		options?: DropdownOption[];
		loadOptions?: () => Promise<DropdownOption[]> | DropdownOption[];
		onchange?: (value: string) => void;
		disabled?: boolean;
		placeholder?: string;
		emptyText?: string;
		class?: string;
		style?: string;
		onmousedown?: (e: MouseEvent) => void;
	}

	let {
		value = '',
		options,
		loadOptions,
		onchange,
		disabled = false,
		placeholder = '-- เลือก --',
		emptyText = 'ไม่มีตัวเลือก',
		class: cls = '',
		style = '',
		onmousedown,
	}: Props = $props();

	let open = $state(false);
	let loading = $state(false);
	let liveOptions = $state<DropdownOption[]>([]);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);

	// Sync when options prop changes externally
	$effect(() => {
		if (options !== undefined) {
			liveOptions = options;
		}
	});

	// Position of the floating list (fixed coords relative to viewport)
	let listStyle = $state('');
	let listMinWidth = $state(0);

	// Portal action — moves element to document.body so CSS transforms on
	// ancestor elements (e.g. canvas zoom/pan) don't break position:fixed.
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	function positionList() {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		listMinWidth = r.width;

		const LIST_MAX_H = 200;
		const spaceBelow = window.innerHeight - r.bottom - 4;
		const spaceAbove = r.top - 4;

		if (spaceBelow >= LIST_MAX_H || spaceBelow >= spaceAbove) {
			// open downward
			listStyle = `top:${r.bottom + 2}px; left:${r.left}px; max-height:${Math.min(LIST_MAX_H, Math.max(spaceBelow, 80))}px;`;
		} else {
			// open upward
			listStyle = `bottom:${window.innerHeight - r.top + 2}px; left:${r.left}px; max-height:${Math.min(LIST_MAX_H, Math.max(spaceAbove, 80))}px;`;
		}
	}

	async function openDropdown(e: MouseEvent) {
		onmousedown?.(e);
		if (disabled) return;

		if (!open) {
			if (loadOptions) {
				loading = true;
				liveOptions = [];
				open = true;
				await tick();
				positionList();
				try {
					const result = await loadOptions();
					liveOptions = result;
				} finally {
					loading = false;
				}
			} else {
				open = true;
				await tick();
				positionList();
			}
		} else {
			open = false;
		}
	}

	function select(opt: DropdownOption) {
		onchange?.(opt.value);
		open = false;
	}

	function onWindowMousedown(e: MouseEvent) {
		if (
			open &&
			triggerEl && !triggerEl.contains(e.target as Node) &&
			listEl && !listEl.contains(e.target as Node)
		) {
			open = false;
		}
	}

	const selectedLabel = $derived(
		liveOptions.find((o) => o.value === value)?.label ?? (value || placeholder)
	);
</script>

<svelte:window onmousedown={onWindowMousedown} />

<button
	bind:this={triggerEl}
	type="button"
	{disabled}
	{style}
	class="dropdown-trigger {cls}"
	onmousedown={openDropdown}
>
	<span class="truncate flex-1 text-left">{selectedLabel}</span>
	<ChevronDown size={10} class="shrink-0 opacity-60 transition-transform {open ? 'rotate-180' : ''}" />
</button>

{#if open}
	<!-- use:portal moves this node to document.body, escaping any CSS transform ancestor -->
	<div
		bind:this={listEl}
		use:portal
		class="dropdown-list"
		style="{listStyle} min-width:{listMinWidth}px;"
	>
		{#if loading}
			<div class="flex items-center justify-center gap-1.5 px-2 py-3 text-[11px] text-gray-500">
				<Loader size={12} class="animate-spin" />
				<span>กำลังโหลด...</span>
			</div>
		{:else if liveOptions.length === 0}
			<div class="px-3 py-2 text-[11px] text-gray-500 italic">{emptyText}</div>
		{:else}
			{#each liveOptions as opt}
				<button
					type="button"
					class="dropdown-item {opt.value === value ? 'active' : ''}"
					onmousedown={(e) => { e.stopPropagation(); select(opt); }}
				>
					{opt.label}
				</button>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 4px;
		width: 100%;
		border-radius: 4px;
		border: 1px solid #374151;
		background: #111827;
		color: #e5e7eb;
		padding: 2px 6px;
		font-size: 11px;
		cursor: pointer;
		transition: border-color 0.15s;
		overflow: hidden;
	}
	.dropdown-trigger:hover:not(:disabled) {
		border-color: #4b5563;
	}
	.dropdown-trigger:focus-visible {
		outline: none;
		border-color: #3b82f6;
	}
	.dropdown-trigger:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Rendered at body level via portal action */
	:global(.dropdown-list) {
		position: fixed;
		z-index: 9999;
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 6px;
		overflow-y: auto;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
		padding: 4px;
		/* scrollbar */
		scrollbar-width: thin;
		scrollbar-color: #4b5563 transparent;
	}

	:global(.dropdown-item) {
		display: block;
		width: 100%;
		text-align: left;
		padding: 4px 8px;
		font-size: 11px;
		color: #d1d5db;
		background: transparent;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: background 0.1s;
	}
	:global(.dropdown-item:hover) {
		background: #374151;
		color: #f9fafb;
	}
	:global(.dropdown-item.active) {
		background: #1d4ed8;
		color: #fff;
	}
</style>
