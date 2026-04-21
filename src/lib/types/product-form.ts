import type { Infer, SuperForm } from 'sveltekit-superforms';
import { productSchema } from '$lib/validation/product/product.schema';

export type ProductFormData = Infer<typeof productSchema>;
export type ProductSuperForm = SuperForm<ProductFormData>;
export type ProductFormStore = ProductSuperForm['form'];

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
