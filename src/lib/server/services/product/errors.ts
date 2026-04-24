export class ProductNotFoundError extends Error {
	constructor(message = 'Produk tidak ditemukan.') {
		super(message);
		this.name = 'ProductNotFoundError';
	}
}

export class InvalidVariantOwnershipError extends Error {
	constructor(message = 'Data varian tidak valid. Silakan refresh halaman lalu coba lagi.') {
		super(message);
		this.name = 'InvalidVariantOwnershipError';
	}
}

export class InvalidOptionGroupOwnershipError extends Error {
	constructor(message = 'Data opsi tidak valid. Silakan refresh halaman lalu coba lagi.') {
		super(message);
		this.name = 'InvalidOptionGroupOwnershipError';
	}
}

export class InvalidOptionOwnershipError extends Error {
	constructor(message = 'Data opsi tidak valid. Silakan refresh halaman lalu coba lagi.') {
		super(message);
		this.name = 'InvalidOptionOwnershipError';
	}
}
