import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { variants } from '$lib/server/db/schema';
import type { UpsertProductSchema } from '$lib/validation/product/product.schema';
import { InvalidVariantOwnershipError } from './errors';

type ProductTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SyncVariantsDiffInput = {
	productId: string;
	variants: UpsertProductSchema['variants'];
};

export async function syncVariantsDiff(tx: ProductTx, input: SyncVariantsDiffInput): Promise<void> {
	const existingVariants = await tx
		.select({
			id: variants.id
		})
		.from(variants)
		.where(eq(variants.productId, input.productId));

	const existingVariantIds = new Set(existingVariants.map((variant) => variant.id));
	const incomingVariantIds = new Set(
		input.variants
			.map((variant) => variant.id)
			.filter((variantId): variantId is string => Boolean(variantId))
	);

	for (const incomingVariantId of incomingVariantIds) {
		if (!existingVariantIds.has(incomingVariantId)) {
			throw new InvalidVariantOwnershipError();
		}
	}

	const variantsToUpdate = input.variants.filter(
		(variant) => typeof variant.id === 'string' && existingVariantIds.has(variant.id)
	);
	const variantsToCreate = input.variants.filter((variant) => !variant.id);
	const variantsToDelete = existingVariants
		.map((variant) => variant.id)
		.filter((existingVariantId) => !incomingVariantIds.has(existingVariantId));

	for (const variant of variantsToUpdate) {
		const variantId = variant.id;
		if (!variantId) continue;

		await tx
			.update(variants)
			.set({
				name: variant.name.trim(),
				price: variant.price,
				stock: variant.stock,
				imgUrl: variant.img_url
			})
			.where(and(eq(variants.id, variantId), eq(variants.productId, input.productId)));
	}

	if (variantsToCreate.length > 0) {
		await tx.insert(variants).values(
			variantsToCreate.map((variant) => ({
				productId: input.productId,
				name: variant.name.trim(),
				price: variant.price,
				stock: variant.stock,
				imgUrl: variant.img_url
			}))
		);
	}

	if (variantsToDelete.length > 0) {
		await tx
			.delete(variants)
			.where(and(eq(variants.productId, input.productId), inArray(variants.id, variantsToDelete)));
	}
}
