import type { Product } from '$lib/types/product';

export const products: Product[] = [
	{
		id: 1,
		title: 'Wireless Headphones',
		description: 'Premium noise-cancelling headphones with 30-hour battery life',
		price: 299.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Audio',
		rating: 4.8,
		inStock: true
	},
	{
		id: 2,
		title: 'Smart Watch Pro',
		description: 'Advanced fitness tracking with heart rate monitor and GPS',
		price: 399.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Wearables',
		rating: 4.6,
		inStock: true
	},
	{
		id: 3,
		title: 'Laptop Stand',
		description: 'Ergonomic aluminum stand for better posture and cooling',
		price: 49.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Accessories',
		rating: 4.9,
		inStock: true
	},
	{
		id: 4,
		title: 'Mechanical Keyboard',
		description: 'RGB backlit gaming keyboard with custom switches',
		price: 159.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Gaming',
		rating: 4.7,
		inStock: false
	},
	{
		id: 5,
		title: '4K Webcam',
		description: 'Ultra HD webcam with auto-focus and noise reduction',
		price: 129.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Video',
		rating: 4.5,
		inStock: true
	},
	{
		id: 6,
		title: 'Portable SSD',
		description: '1TB external storage with USB-C and lightning-fast speeds',
		price: 179.99,
		image: 'https://source.unsplash.com/random/400x400',
		category: 'Storage',
		rating: 4.8,
		inStock: true
	}
];
