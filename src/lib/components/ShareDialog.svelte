<script lang="ts">
    import { X, Link2, QrCode, Code2, Copy, Check, ExternalLink } from 'lucide-svelte';
    import QRCode from 'qrcode';

    let {
        open      = $bindable(false),
        shareUrl  = '',
    }: {
        open:     boolean;
        shareUrl: string;
    } = $props();

    type Tab = 'link' | 'qr' | 'embed';
    let tab        = $state<Tab>('link');
    let copied     = $state<string | null>(null);
    let qrDataUrl  = $state<string>('');
    let qrError    = $state(false);

    $effect(() => {
        if (tab === 'qr' && shareUrl) {
            qrError = false;
            QRCode.toDataURL(shareUrl, { errorCorrectionLevel: 'M', width: 240, margin: 2 })
                .then(url  => { qrDataUrl = url; })
                .catch(()  => { qrError   = true; });
        }
    });

    const embedUrl  = $derived(`${shareUrl}&embed`);
    const iframeCode = $derived(
        `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  style="border:none; border-radius:8px;"\n  allow="serial"\n></iframe>`
    );

    async function copy(text: string, key: string) {
        await navigator.clipboard.writeText(text);
        copied = key;
        setTimeout(() => { copied = null; }, 2000);
    }

    function close() { open = false; }
</script>

{#if open}
<!-- backdrop -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed inset-0 z-50 flex items-start p-3 justify-center bg-black/60"
    role="dialog" aria-modal="true"
    onclick={close}
>
    <!-- panel -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onclick={(e) => e.stopPropagation()}
    >
        <!-- header -->
        <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-white">Share Project</h2>
            <button onclick={close} class="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300">
                <X size={16} />
            </button>
        </div>

        <!-- tabs -->
        <div class="mb-5 flex gap-1 rounded-lg bg-gray-800 p-1">
            {#each ([['link', Link2, 'Link'], ['qr', QrCode, 'QR Code'], ['embed', Code2, 'Embed Code']] as const) as [id, Icon, label]}
                <button
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors
                           {tab === id ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}"
                    onclick={() => tab = id}
                >
                    <Icon size={13} />{label}
                </button>
            {/each}
        </div>

        <!-- tab: link -->
        {#if tab === 'link'}
            <p class="mb-3 text-xs text-gray-400">Your project URL for share</p>
            <div class="flex gap-2">
                <input
                    value={shareUrl}
                    readonly
                    class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 focus:outline-none"
                    onclick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                    onclick={() => copy(shareUrl, 'link')}
                    class="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700"
                >
                    {#if copied === 'link'}
                        <Check size={13} class="text-green-400" />Copied !
                    {:else}
                        <Copy size={13} />Copy
                    {/if}
                </button>
            </div>

        <!-- tab: qr -->
        {:else if tab === 'qr'}
            <p class="mb-4 text-xs text-gray-400">Scan QR Code for open your project on others devices</p>
            <div class="flex flex-col items-center gap-3">
                {#if qrError}
                    <div class="rounded-xl border border-red-700 bg-red-900/20 px-4 py-3 text-xs text-red-400">
                        Can't create QR Code — maybe URL are too long.
                    </div>
                {:else if qrDataUrl}
                    <div class="rounded-xl bg-white p-3">
                        <img src={qrDataUrl} alt="QR Code" width="240" height="240" class="block" />
                    </div>
                {:else}
                    <div class="flex h-66 w-66 items-center justify-center rounded-xl border border-gray-700 bg-gray-800">
                        <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-white"></div>
                    </div>
                {/if}
            </div>

        <!-- tab: embed -->
        {:else if tab === 'embed'}
            <p class="mb-3 text-xs text-gray-400">
                Embed your workflow to your website
            </p>
            <div class="relative rounded-lg border border-gray-700 bg-gray-800">
                <pre class="overflow-x-auto p-3 text-xs text-gray-300">{iframeCode}</pre>
                <button
                    onclick={() => copy(iframeCode, 'embed')}
                    class="absolute right-2 top-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                >
                    {#if copied === 'embed'}
                        <Check size={12} class="text-green-400" />Copied !
                    {:else}
                        <Copy size={12} />Copy
                    {/if}
                </button>
            </div>
        {/if}
    </div>
</div>
{/if}
