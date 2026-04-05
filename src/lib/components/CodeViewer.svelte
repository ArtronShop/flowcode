<script lang="ts">
	import { codeToHtml } from 'shiki';

	interface Props {
		code: string;
		lang?: string;
	}

	let { code, lang = 'c' }: Props = $props();

	let html = $state('');

	$effect(() => {
		if (!code.trim()) {
			html = '';
			return;
		}
		codeToHtml(code, {
			lang,
			theme: 'one-dark-pro',
			transformers: [
				{
					pre(node) {
						// Replace <pre> with <div> so browser's white-space:pre
						// doesn't turn inter-line newlines into visible gaps
						node.tagName = 'div';
					},
					line(node, line) {
						node.properties['data-line'] = line;
					}
				}
			]
		}).then((result) => {
			html = result;
		});
	});
</script>

{#if html}
	<div class="code-viewer">
		{@html html}
	</div>
{:else}
	<div class="flex flex-1 items-center justify-center text-[11px] text-gray-600">
		ยังไม่มีโค้ด วางบล็อกลงในพื้นที่ทำงานแล้วเชื่อมต่อกัน
	</div>
{/if}

<style>
	.code-viewer {
		flex: 1;
		overflow: auto;
		font-size: 11px;
	}

	/* shiki root is now a <div> (transformer changed it from <pre>) */
	.code-viewer :global(.shiki) {
		margin: 0;
		padding: 12px 0;
		background: transparent !important;
		min-height: 100%;
		counter-reset: line;
		line-height: 1;
	}

	.code-viewer :global(code) {
		display: block;
		font-family: 'Consolas', 'JetBrains Mono', 'Fira Code', monospace;
		font-size: inherit;
	}

	/* Each line */
	.code-viewer :global(.line) {
		display: block;
		padding-right: 16px;
		counter-increment: line;
		line-height: 1.6em;
		min-height: 1.6em;
		white-space: pre;
	}

	/* Line number via pseudo-element */
	.code-viewer :global(.line::before) {
		content: counter(line);
		display: inline-block;
		width: 2.8em;
		padding-right: 1em;
		text-align: right;
		color: #4b5563;
		user-select: none;
		border-right: 1px solid #1f2937;
		margin-right: 1em;
		font-variant-numeric: tabular-nums;
	}

	/* Hover highlight */
	.code-viewer :global(.line:hover) {
		background: rgba(255, 255, 255, 0.03);
	}
	.code-viewer :global(.line:hover::before) {
		color: #9ca3af;
	}
</style>
