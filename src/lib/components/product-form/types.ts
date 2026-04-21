export type ProductVariant = {
	name: string;
	price: number;
	stock: number;
	img_url?: string;
};

export type ProductOption = {
	name: string;
	additionalPrice: number;
};

export type ProductOptionGroup = {
	name: string;
	options: ProductOption[];
};
