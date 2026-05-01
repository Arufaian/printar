<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { isAllSelected, onToggleSelectAll }: Props = $props();

	type Props = {
		isAllSelected: boolean;
		onToggleSelectAll: (checked: boolean) => void;
	};
</script>

<div class="flex items-center gap-2 p-4 md:px-6">
	<Checkbox
		id="select-all-cart-items"
		checked={isAllSelected}
		onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))}
	/>
	<Label for="select-all-cart-items">Pilih Semua</Label>
</div>
