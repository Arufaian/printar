<script lang="ts">
	import { enhance as kitEnhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { createColumns, type Product } from './columns.js';
	import type { PageData } from './$types';
	import Button from '$lib/components/ui/button/button.svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let deleteDialogOpen = $state(false);
	let selectedProduct = $state<Product | null>(null);

	const getTableData = (): Product[] =>
		data.response.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			categoryId: item.categoryId,
			createdAt: item.createdAt,
			deletedAt: item.deletedAt,
			categoryName: item.categoryName,
			variantsCount: item.variantsCount,
			lowestPrice: item.lowestPrice,
			totalStock: item.totalStock
		}));

	const onDelete = (product: Product) => {
		selectedProduct = product;
		deleteDialogOpen = true;
	};

	const columns = createColumns({
		onEdit: () => {},
		onDelete
	});
</script>

<section>
	<div class="w-full min-w-0">
		<form
			id="delete-product-form"
			method="POST"
			action={selectedProduct ? `/admin/products/${selectedProduct.id}/delete` : ''}
			class="hidden"
			use:kitEnhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						const message =
							typeof result.data?.text === 'string' ? result.data.text : 'Produk berhasil dihapus.';

						toast.success(message);
						deleteDialogOpen = false;
						selectedProduct = null;
						await update();
						await invalidateAll();
						return;
					}

					if (result.type === 'failure') {
						const message =
							typeof result.data?.message === 'string'
								? result.data.message
								: 'Gagal menghapus produk. Silakan coba lagi.';

						toast.error(message);
						return;
					}

					toast.error('Terjadi gangguan saat menghapus produk. Silakan coba lagi.');
				};
			}}
		>
			<input type="hidden" name="productId" value={selectedProduct?.id ?? ''} />
		</form>

		<div>
			<a href={resolve('/admin/products/new')}>
				<Button>Tambah Produk</Button>
			</a>
		</div>

		<AlertDialog.Root bind:open={deleteDialogOpen}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Hapus produk?</AlertDialog.Title>
					<AlertDialog.Description>
						Produk <strong>{selectedProduct?.name ?? '-'}</strong> akan dihapus permanen. Tindakan ini
						tidak dapat dibatalkan.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
					<AlertDialog.Action type="submit" form="delete-product-form" variant="destructive">
						Hapus produk
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>

		<DataTable
			data={getTableData()}
			{columns}
			filterColumnId="name"
			filterPlaceholder="Cari produk..."
		/>
	</div>
</section>
