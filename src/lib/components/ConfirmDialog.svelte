<script lang="ts">
	export interface ConfirmOptions {
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		hideCancel?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	interface Props extends ConfirmOptions {
		open?: boolean;
	}

	let {
		open = $bindable(false),
		title = 'ยืนยัน',
		message = '',
		confirmLabel = 'ยืนยัน',
		cancelLabel = 'ยกเลิก',
		hideCancel = false,
		onconfirm,
		oncancel,
	}: Props = $props();

	function confirm() {
		open = false;
		onconfirm?.();
	}

	function cancel() {
		open = false;
		oncancel?.();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
		onclick={cancel}
		onkeydown={(e) => e.key === 'Escape' && cancel()}
	>
		<!-- Dialog -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="w-80 rounded-xl border border-gray-700 bg-gray-800 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<div class="px-5 pt-5 pb-4">
				<p id="dialog-title" class="text-sm font-semibold text-white">{title}</p>
				{#if message}
					<p class="mt-1.5 whitespace-pre-wrap text-xs text-gray-400">{message}</p>
				{/if}
			</div>
			<div class="flex justify-end gap-2 border-t border-gray-700 px-5 py-3">
				{#if !hideCancel}
				<button
					onclick={cancel}
					class="rounded-lg px-3.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				>
					{cancelLabel}
				</button>
				{/if}
				<button
					onclick={confirm}
					class="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs text-white transition-colors hover:bg-red-500"
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
