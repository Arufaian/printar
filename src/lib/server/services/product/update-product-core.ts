import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { ProductNotFoundError } from './errors';

type ProductTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type UpdateProductCoreInput = {
	productId: string;
	name: string;
	slug: string;
	description?: string;
	categoryId: string;
};

export async function updateProductCore(
	tx: ProductTx,
	input: UpdateProductCoreInput
): Promise<void> {
	const updatedProduct = await tx
		.update(products)
		.set({
			name: input.name,
			slug: input.slug,
			description: input.description,
			categoryId: input.categoryId
		})
		.where(eq(products.id, input.productId))
		.returning({ id: products.id });

	if (updatedProduct.length === 0) {
		throw new ProductNotFoundError();
	}
}
