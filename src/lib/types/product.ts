/** Product interface */
export interface Product {
	id: string | number;
	title: string;
	description: string;
	price: number;
	image: string;
	category?: string;
	rating?: number;
	inStock?: boolean;
}

/** Product card event handlers */
export interface ProductCardEvents {
	onAddToCart?: (product: Product) => void;
	onViewDetails?: (product: Product) => void;
}