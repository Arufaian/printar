import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	checkoutIntentItems,
	checkoutIntents,
	orderItemOptions,
	orderItems,
	orders,
	profiles
} from '$lib/server/db/schema';
import { CheckoutIntentError } from './errors';

type MaterializeParams = {
	userId: string;
	intentId: string;
	sourceOrderId: string;
	grossAmount: number;
};

type MaterializeResult = {
	transactionOrderId: string;
	statusBeforeCreate: string;
	customerFirstName: string | undefined;
};

export async function materializeTransactionOrderFromIntent(
	params: MaterializeParams
): Promise<MaterializeResult> {
	const [intentRow] = await db
		.select({
			id: checkoutIntents.id,
			transactionOrderId: checkoutIntents.transactionOrderId,
			deliveryMethod: checkoutIntents.deliveryMethod,
			shippingCost: checkoutIntents.shippingCost
		})
		.from(checkoutIntents)
		.where(
			and(
				eq(checkoutIntents.id, params.intentId),
				eq(checkoutIntents.profileId, params.userId),
				eq(checkoutIntents.orderId, params.sourceOrderId),
				eq(checkoutIntents.status, 'active')
			)
		)
		.limit(1);

	if (!intentRow?.id) {
		throw new CheckoutIntentError(404, 'Checkout intent tidak ditemukan atau tidak aktif.');
	}

	const [sourceOrderRow] = await db
		.select({
			addressId: orders.addressId,
			customerNote: orders.customerNote,
			deliveryMethod: orders.deliveryMethod,
			shippingCost: orders.shippingCost
		})
		.from(orders)
		.where(and(eq(orders.id, params.sourceOrderId), eq(orders.profileId, params.userId)))
		.limit(1);

	if (!sourceOrderRow) {
		throw new CheckoutIntentError(404, 'Order sumber checkout tidak ditemukan.');
	}

	const normalizedIntentDeliveryMethod = intentRow.deliveryMethod?.trim() || null;
	const finalDeliveryMethod =
		normalizedIntentDeliveryMethod ?? sourceOrderRow.deliveryMethod ?? null;
	const finalShippingCost =
		normalizedIntentDeliveryMethod !== null
			? (intentRow.shippingCost ?? 0)
			: (sourceOrderRow.shippingCost ?? 0);

	const [profileRow] = await db
		.select({ firstName: profiles.name })
		.from(profiles)
		.where(eq(profiles.id, params.userId))
		.limit(1);

	if (intentRow.transactionOrderId) {
		const [transactionOrder] = await db
			.select({ id: orders.id, status: orders.status })
			.from(orders)
			.where(and(eq(orders.id, intentRow.transactionOrderId), eq(orders.profileId, params.userId)))
			.limit(1);

		if (transactionOrder?.id) {
			if (transactionOrder.status === 'draft') {
				await db
					.update(orders)
					.set({
						totalPrice: params.grossAmount,
						addressId: sourceOrderRow.addressId ?? null,
						customerNote: sourceOrderRow.customerNote ?? null,
						deliveryMethod: finalDeliveryMethod,
						shippingCost: finalShippingCost,
						updatedAt: new Date()
					})
					.where(eq(orders.id, transactionOrder.id));
			}

			return {
				transactionOrderId: transactionOrder.id,
				statusBeforeCreate: transactionOrder.status ?? 'draft',
				customerFirstName: profileRow?.firstName ?? undefined
			};
		}
	}

	const selectedIntentItems = await db
		.select({ orderItemId: checkoutIntentItems.orderItemId })
		.from(checkoutIntentItems)
		.where(eq(checkoutIntentItems.intentId, params.intentId));

	const selectedItemIds = selectedIntentItems
		.map((row) => row.orderItemId)
		.filter((itemId): itemId is string => Boolean(itemId));

	if (selectedItemIds.length === 0) {
		throw new CheckoutIntentError(
			400,
			'Checkout intent tidak memiliki item. Silakan pilih ulang item.'
		);
	}

	const sourceItemRows = await db
		.select({
			id: orderItems.id,
			variantId: orderItems.variantId,
			quantity: orderItems.quantity,
			price: orderItems.price,
			filePath: orderItems.filePath
		})
		.from(orderItems)
		.where(
			and(eq(orderItems.orderId, params.sourceOrderId), inArray(orderItems.id, selectedItemIds))
		);

	if (sourceItemRows.length !== selectedItemIds.length) {
		throw new CheckoutIntentError(404, 'Sebagian item checkout sudah tidak tersedia.');
	}

	const now = new Date();
	const [newOrder] = await db
		.insert(orders)
		.values({
			profileId: params.userId,
			status: 'draft',
			addressId: sourceOrderRow.addressId ?? null,
			customerNote: sourceOrderRow.customerNote ?? null,
			deliveryMethod: finalDeliveryMethod,
			shippingCost: finalShippingCost,
			totalPrice: params.grossAmount,
			updatedAt: now,
			createdAt: now
		})
		.returning({ id: orders.id, status: orders.status });

	if (!newOrder?.id) {
		throw new CheckoutIntentError(500, 'Gagal membuat order transaksi.');
	}

	const transactionOrderId = newOrder.id;

	const itemIdMap = new Map<string, string>();
	const copiedItems = sourceItemRows.map((item) => {
		const newItemId = crypto.randomUUID();
		itemIdMap.set(item.id, newItemId);
		return {
			id: newItemId,
			orderId: transactionOrderId,
			variantId: item.variantId,
			quantity: item.quantity,
			price: item.price,
			filePath: item.filePath
		};
	});

	await db.insert(orderItems).values(copiedItems);

	const sourceOptionRows = await db
		.select({
			orderItemId: orderItemOptions.orderItemId,
			optionId: orderItemOptions.optionId,
			price: orderItemOptions.price
		})
		.from(orderItemOptions)
		.where(inArray(orderItemOptions.orderItemId, selectedItemIds));

	if (sourceOptionRows.length > 0) {
		const copiedOptions = sourceOptionRows
			.map((row) => {
				if (!row.orderItemId) return null;
				const mappedOrderItemId = itemIdMap.get(row.orderItemId);
				if (!mappedOrderItemId) return null;

				return {
					id: crypto.randomUUID(),
					orderItemId: mappedOrderItemId,
					optionId: row.optionId,
					price: row.price
				};
			})
			.filter((value): value is NonNullable<typeof value> => Boolean(value));

		if (copiedOptions.length > 0) {
			await db.insert(orderItemOptions).values(copiedOptions);
		}
	}

	await db
		.update(checkoutIntents)
		.set({
			transactionOrderId,
			updatedAt: now
		})
		.where(
			and(eq(checkoutIntents.id, params.intentId), isNull(checkoutIntents.transactionOrderId))
		);

	const [resolvedIntent] = await db
		.select({ transactionOrderId: checkoutIntents.transactionOrderId })
		.from(checkoutIntents)
		.where(eq(checkoutIntents.id, params.intentId))
		.limit(1);

	if (!resolvedIntent?.transactionOrderId) {
		throw new CheckoutIntentError(500, 'Gagal menyimpan order transaksi intent.');
	}

	return {
		transactionOrderId: resolvedIntent.transactionOrderId,
		statusBeforeCreate: 'draft',
		customerFirstName: profileRow?.firstName ?? undefined
	};
}
