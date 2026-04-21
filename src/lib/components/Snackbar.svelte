<script lang="ts">
    import { snackbar } from './snackbar.svelte.js';
    import { X, CircleCheck, CircleAlert, Info, ExternalLink } from 'lucide-svelte';

    const ICONS = {
        success: CircleCheck,
        error: CircleAlert,
        info: Info,
    } as const;

    const STYLES = {
        success: 'border-l-green-500 text-green-400',
        error:   'border-l-red-500 text-red-400',
        info:    'border-l-blue-500 text-blue-400',
    } as const;
</script>

<div class="fixed bottom-6 right-6 z-9999 flex flex-col-reverse gap-2 pointer-events-none">
    {#each snackbar.items as item (item.id)}
        {@const Icon = ICONS[item.type]}
        <div
            class="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-gray-700 border-l-4
                   bg-gray-800 px-4 py-3 shadow-2xl {STYLES[item.type]}"
            role="alert"
        >
            <!-- Icon -->
            <span class="mt-0.5 shrink-0">
                <Icon size={16} />
            </span>

            <!-- Message -->
            <p class="flex-1 text-xs leading-relaxed text-gray-200">{item.message}</p>

            <!-- Action button -->
            {#if item.action}
                {#if item.action.href}
                    <a
                        href={item.action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium
                               text-blue-400 hover:bg-gray-700 transition-colors"
                    >
                        {item.action.label}
                        <ExternalLink size={11} />
                    </a>
                {:else}
                    <button
                        onclick={item.action.onclick}
                        class="shrink-0 rounded px-2 py-1 text-xs font-medium
                               text-blue-400 hover:bg-gray-700 transition-colors"
                    >
                        {item.action.label}
                    </button>
                {/if}
            {/if}

            <!-- Close button -->
            {#if !item.hideClose}
            <button
                onclick={() => snackbar.close(item.id)}
                class="shrink-0 mt-0.5 rounded p-0.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors"
                aria-label="ปิด"
            >
                <X size={13} />
            </button>
            {/if}
        </div>
    {/each}
</div>
