<script lang="ts">
	import { Truck, BanknoteArrowDown, Zap } from '@lucide/svelte';
</script>

<div class="w-full bg-primary py-1.5">
	<div class="container flex items-center justify-center gap-24">
		<div class="flex items-center justify-center gap-1">
			<Truck class="text-xs text-secondary" strokeWidth={1.5} />
			<span class="text-xs text-secondary"> Delivery</span>
		</div>

		<div class="flex items-center justify-center gap-1">
			<BanknoteArrowDown class="text-xs text-secondary" strokeWidth={1.5} />
			<span class="text-xs text-secondary"> Harga bersaing</span>
		</div>

		<div class="flex items-center justify-center gap-1">
			<Zap class="text-xs text-secondary" strokeWidth={1.5} />
			<span class="text-xs text-secondary"> Proses Cepat</span>
		</div>
	</div>
</div>
