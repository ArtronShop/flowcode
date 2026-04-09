<script lang="ts">
	import { StickyNote, Copy, BookOpen, Trash2 } from 'lucide-svelte';

	interface Props {
		x: number;
		y: number;
		onaddnote?: () => void;
		onduplicate?: () => void;
		onhelp?: () => void;
		ondelete?: () => void;
		onclose?: () => void;
	}

	let { x, y, onaddnote, onduplicate, onhelp, ondelete, onclose }: Props = $props();

	const items = $derived([
		{ label: 'เพิ่มโน็ต',  icon: StickyNote, action: onaddnote,  class: '' },
		{ label: 'ทำซ้ำ',      icon: Copy,       action: onduplicate, class: '' },
		{ label: 'วิธีใช้',    icon: BookOpen,   action: onhelp,      class: '' },
		{ label: 'ลบ',         icon: Trash2,     action: ondelete,    class: 'text-red-400 hover:text-red-300' },
	]);

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
			{#if i === 3}
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
