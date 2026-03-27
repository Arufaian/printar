<script lang="ts">
	import { PrinterIcon } from '@lucide/svelte/icons';
	import { resolve } from '$app/paths';
</script>

<div class="flex flex-col gap-4">
	<a href={resolve('/')} class="group flex items-center gap-2" aria-label="PrintHub Home">
		<div
			class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105"
		>
			<PrinterIcon class="size-6" />
		</div>
		<span class="text-xl font-bold">PrintHub</span>
	</a>
	<p class="text-sm font-medium text-muted-foreground">Professional Digital Printing Solutions</p>
	<p class="max-w-xs text-sm text-muted-foreground">
		Your trusted partner for high-quality printing services since 2020.
	</p>
</div>
