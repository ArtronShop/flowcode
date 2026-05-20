<script lang="ts">
	import { StickyNote, Copy, ClipboardPaste, BookOpen, Trash2 } from 'lucide-svelte';

	interface Props {
		x: number;
		y: number;
		onaddnote?: () => void;
		oncopy?: () => void;
		onpaste?: () => void;
		onduplicate?: () => void;
		onhelp?: () => void;
		ondelete?: () => void;
		onclose?: () => void;
		hasClipboard?: boolean;
	}

	let { x, y, onaddnote, oncopy, onpaste, onduplicate, onhelp, ondelete, onclose, hasClipboard = false }: Props = $props();

	const items = $derived([
		{ label: 'Add Note',   icon: StickyNote,      action: onaddnote,   class: '', show: true },
		{ label: 'Copy',       icon: Copy,            action: oncopy,      class: '', show: true },
		{ label: 'Paste',      icon: ClipboardPaste,  action: onpaste,     class: '', show: hasClipboard },
		{ label: 'Duplicate',  icon: Copy,            action: onduplicate, class: '', show: true },
		{ label: 'Help',       icon: BookOpen,        action: onhelp,      class: '', show: true },
		{ label: 'Delete',     icon: Trash2,          action: ondelete,    class: 'text-red-400 hover:text-red-300', show: true },
	].filter(i => i.show));

	function pick(action?: () => void) {
		action?.();
		onclose?.();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50"
	onclick={onclose}
	oncontextmenu={(e) => { e.preventDefault(); onclose?.(); }}
	onkeydown={(e) => e.key === 'Escape' && onclose?.()}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="absolute min-w-36 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-2xl"
		style="left:{x}px; top:{y}px;"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		{#each items as item, i}
			{#if item.label === 'Delete'}
				<div class="my-1 border-t border-gray-700"></div>
			{/if}
			<button
				class="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700 {item.class}"
				onclick={() => pick(item.action)}
			>
				<item.icon size={14} />
				{item.label}
			</button>
		{/each}
	</div>
</div>
