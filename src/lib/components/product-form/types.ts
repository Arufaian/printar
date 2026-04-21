export type ProductVariant = {
	name: string;
	price: number;
	stock: number;
	img_url: string;
};

export type ProductOption = {
	name: string;
	additionalPrice: number;
};

export type ProductOptionGroup = {
	name: string;
	options: ProductOption[];
};

export type ProductPayload = {
	name: string;
	description: string;
	categoryId: string;
	variants: ProductVariant[];
	optionGroups: ProductOptionGroup[];
};
