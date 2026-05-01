export type CartItemData = {
	id: string;
	title: string;
	variant: string;
	options: string[];
	designFilePath: string | null;
	hasDesignFile: boolean;
	image: string;
	unitPrice: number;
	quantity: number;
	stock: number;
};

export type CartSummaryData = {
	orderId: string | null;
	subtotal: number;
	shippingCost: number;
	total: number;
};

export type CartPayload = {
	cartItems: CartItemData[];
	summary: CartSummaryData;
};

export type DraftItemOwnership = {
	orderId: string;
	itemId: string;
	variantStock: number;
	filePath: string | null;
};
