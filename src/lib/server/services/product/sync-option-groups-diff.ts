import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { optionGroups, options } from '$lib/server/db/schema';
import type { UpsertProductSchema } from '$lib/validation/product/product.schema';
import { InvalidOptionGroupOwnershipError, InvalidOptionOwnershipError } from './errors';

type ProductTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SyncOptionGroupsDiffInput = {
	productId: string;
	optionGroups: UpsertProductSchema['optionGroups'];
};

export async function syncOptionGroupsDiff(
	tx: ProductTx,
	input: SyncOptionGroupsDiffInput
): Promise<void> {
	const existingOptionGroups = await tx
		.select({
			id: optionGroups.id
		})
		.from(optionGroups)
		.where(eq(optionGroups.productId, input.productId));

	const existingGroupIds = new Set(existingOptionGroups.map((group) => group.id));
	const incomingGroupIds = new Set(
		input.optionGroups
			.map((group) => group.id)
			.filter((groupId): groupId is string => Boolean(groupId))
	);

	for (const incomingGroupId of incomingGroupIds) {
		if (!existingGroupIds.has(incomingGroupId)) {
			throw new InvalidOptionGroupOwnershipError();
		}
	}

	const groupsToUpdate = input.optionGroups.filter(
		(group) => typeof group.id === 'string' && existingGroupIds.has(group.id)
	);
	const groupsToCreate = input.optionGroups.filter((group) => !group.id);
	const groupsToDelete = existingOptionGroups
		.map((group) => group.id)
		.filter((existingGroupId) => !incomingGroupIds.has(existingGroupId));

	for (const group of groupsToUpdate) {
		const groupId = group.id;
		if (!groupId) continue;

		await tx
			.update(optionGroups)
			.set({
				name: group.name.trim()
			})
			.where(and(eq(optionGroups.id, groupId), eq(optionGroups.productId, input.productId)));

		const existingOptions = await tx
			.select({
				id: options.id
			})
			.from(options)
			.where(eq(options.optionGroupId, groupId));

		const existingOptionIds = new Set(existingOptions.map((option) => option.id));
		const incomingOptionIds = new Set(
			group.options
				.map((option) => option.id)
				.filter((optionId): optionId is string => Boolean(optionId))
		);

		for (const incomingOptionId of incomingOptionIds) {
			if (!existingOptionIds.has(incomingOptionId)) {
				throw new InvalidOptionOwnershipError();
			}
		}

		const optionsToUpdate = group.options.filter(
			(option) => typeof option.id === 'string' && existingOptionIds.has(option.id)
		);
		const optionsToCreate = group.options.filter((option) => !option.id);
		const optionsToDelete = existingOptions
			.map((option) => option.id)
			.filter((existingOptionId) => !incomingOptionIds.has(existingOptionId));

		for (const option of optionsToUpdate) {
			const optionId = option.id;
			if (!optionId) continue;

			await tx
				.update(options)
				.set({
					name: option.name.trim(),
					additionalPrice: option.additionalPrice
				})
				.where(and(eq(options.id, optionId), eq(options.optionGroupId, groupId)));
		}

		if (optionsToCreate.length > 0) {
			await tx.insert(options).values(
				optionsToCreate.map((option) => ({
					optionGroupId: groupId,
					name: option.name.trim(),
					additionalPrice: option.additionalPrice
				}))
			);
		}

		if (optionsToDelete.length > 0) {
			await tx
				.delete(options)
				.where(and(eq(options.optionGroupId, groupId), inArray(options.id, optionsToDelete)));
		}
	}

	for (const group of groupsToCreate) {
		const [createdGroup] = await tx
			.insert(optionGroups)
			.values({
				productId: input.productId,
				name: group.name.trim()
			})
			.returning({ id: optionGroups.id });

		if (!createdGroup?.id) {
			throw new Error('Failed to create option group.');
		}

		if (group.options.length > 0) {
			await tx.insert(options).values(
				group.options.map((option) => ({
					optionGroupId: createdGroup.id,
					name: option.name.trim(),
					additionalPrice: option.additionalPrice
				}))
			);
		}
	}

	if (groupsToDelete.length > 0) {
		await tx
			.delete(optionGroups)
			.where(
				and(eq(optionGroups.productId, input.productId), inArray(optionGroups.id, groupsToDelete))
			);
	}
}
