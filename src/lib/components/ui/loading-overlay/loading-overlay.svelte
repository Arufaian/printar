<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	let { message = 'Memuat...' }: { message?: string } = $props();
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
	role="status"
	aria-live="polite"
	aria-label={message}
>
	<div class="flex items-center gap-2 rounded-md border bg-card/85 px-4 py-3 shadow-sm">
		<Spinner class="size-4" />
		<span class="text-sm text-foreground">{message}</span>
	</div>
</div>
