export class StoreCategoryNotFoundError extends Error {
	constructor(message = 'Kategori tidak ditemukan.') {
		super(message);
		this.name = 'StoreCategoryNotFoundError';
	}
}

export class StoreProductNotFoundError extends Error {
	constructor(message = 'Produk tidak ditemukan.') {
		super(message);
		this.name = 'StoreProductNotFoundError';
	}
}
