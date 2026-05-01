import type {
	CheckoutAddress,
	CheckoutItem,
	CheckoutStep,
	PaymentMethod
} from '$lib/types/checkout';

export const CHECKOUT_STEPS: CheckoutStep[] = [
	{
		id: 'shipping',
		title: 'Data Pengiriman',
		description: 'Lengkapi alamat dan kontak penerima',
		path: '/checkout/shipping'
	},
	{
		id: 'review',
		title: 'Review Pesanan',
		description: 'Periksa item, jumlah, dan ringkasan biaya',
		path: '/checkout/review'
	},
	{
		id: 'payment',
		title: 'Pembayaran',
		description: 'Pilih metode lalu konfirmasi transaksi',
		path: '/checkout/payment'
	}
];

export const CHECKOUT_ITEMS: CheckoutItem[] = [
	{
		id: 'item-1',
		name: 'Kartu Nama Premium',
		variant: 'Matte Laminating - 100 pcs',
		quantity: 2,
		unitPrice: 45000
	},
	{
		id: 'item-2',
		name: 'Flyer Promosi A5',
		variant: 'Art Paper 120gsm - 500 pcs',
		quantity: 1,
		unitPrice: 120000
	},
	{
		id: 'item-3',
		name: 'Stiker Vinyl Custom',
		variant: 'Ukuran 7x7 cm - 50 pcs',
		quantity: 3,
		unitPrice: 30000
	}
];

export const CHECKOUT_ADDRESSES: CheckoutAddress[] = [
	{
		id: 'addr-1',
		label: 'Rumah',
		recipient: 'Alfian Pratama',
		phone: '0812-3456-7890',
		addressLine: 'Jl. Melati No. 12, RT 03/RW 04',
		city: 'Bandung',
		postalCode: '40123',
		isDefault: true
	},
	{
		id: 'addr-2',
		label: 'Kantor',
		recipient: 'Alfian Pratama',
		phone: '0812-3456-7890',
		addressLine: 'Jl. Gatot Subroto Kav. 18, Lantai 7',
		city: 'Bandung',
		postalCode: '40262'
	}
];

export const PAYMENT_METHODS: PaymentMethod[] = [
	{
		id: 'bank_transfer',
		label: 'Transfer Bank',
		description: 'Verifikasi otomatis setelah pembayaran diterima.'
	},
	{
		id: 'e_wallet',
		label: 'E-Wallet',
		description: 'Pembayaran instan melalui dompet digital.'
	},
	{
		id: 'cod',
		label: 'Bayar di Tempat (COD)',
		description: 'Tersedia untuk area dan nominal tertentu.'
	}
];

export const DEFAULT_SHIPPING_COST = 18000;
