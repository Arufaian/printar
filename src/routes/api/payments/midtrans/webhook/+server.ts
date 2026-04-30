import { json } from '@sveltejs/kit';
import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orderItems, orderStatusLogs, orders, payments, variants } from '$lib/server/db/schema';
import {
	mapMidtransStatusToOrderStatus,
	verifyMidtransSignature
} from '$lib/server/services/payment';
import type { RequestHandler } from './$types';

const webhookSchema = z.object({
	order_id: z.string().min(1),
	transaction_status: z.string().min(1),
	status_code: z.string().min(1),
	gross_amount: z.string().min(1),
	signature_key: z.string().min(1),
	payment_type: z.string().optional()
});

const paymentStatusSchema = z.enum(['pending', 'settlement', 'expire', 'cancel']);

function resolveInternalOrderId(midtransOrderId: string): string | null {
	return z.uuid().safeParse(midtransOrderId).success ? midtransOrderId : null;
}

function mapTransactionStatusToPaymentStatus(transactionStatus: string) {
	const normalized = transactionStatus.toLowerCase();
	const parsed = paymentStatusSchema.safeParse(normalized);
	return parsed.success ? parsed.data : null;
}

class StockInsufficientError extends Error {}

export const POST: RequestHandler = async (event) => {
	let payload: unknown;
	try {
		payload = await event.request.json();
	} catch {
		return json({ message: 'Payload tidak valid.' }, { status: 400 });
	}

	const parsedPayload = webhookSchema.safeParse(payload);
	if (!parsedPayload.success) {
		return json({ message: 'Payload webhook tidak valid.' }, { status: 400 });
	}

	const webhookPayload = parsedPayload.data;

	if (!verifyMidtransSignature(webhookPayload)) {
		return json({ message: 'Signature tidak valid.' }, { status: 401 });
	}

	const internalOrderId = resolveInternalOrderId(webhookPayload.order_id);
	if (!internalOrderId) {
		return json({ message: 'Format order_id Midtrans tidak valid.' }, { status: 400 });
	}

	const paymentStatus = mapTransactionStatusToPaymentStatus(webhookPayload.transaction_status);
	if (!paymentStatus) {
		return json({ message: 'Status transaksi Midtrans tidak didukung.' }, { status: 400 });
	}

	const rawResponse = {
		...(typeof payload === 'object' && payload ? payload : {}),
		received_at: new Date().toISOString()
	};

	const mappedOrderStatus = mapMidtransStatusToOrderStatus(webhookPayload.transaction_status);

	try {
		const status = await db.transaction(async (tx) => {
			const [orderRow] = await tx
				.select({ id: orders.id, status: orders.status })
				.from(orders)
				.where(eq(orders.id, internalOrderId))
				.limit(1);

			if (!orderRow?.id) {
				return 404;
			}

			const [existingPayment] = await tx
				.select({ id: payments.id })
				.from(payments)
				.where(eq(payments.orderId, internalOrderId))
				.limit(1);

			if (existingPayment?.id) {
				await tx
					.update(payments)
					.set({
						status: paymentStatus,
						paymentMethod: webhookPayload.payment_type ?? null,
						rawResponse
					})
					.where(eq(payments.id, existingPayment.id));
			} else {
				await tx.insert(payments).values({
					orderId: internalOrderId,
					status: paymentStatus,
					paymentMethod: webhookPayload.payment_type ?? null,
					rawResponse
				});
			}

			const shouldDecrementStock = mappedOrderStatus === 'paid' && orderRow.status !== 'paid';
			if (shouldDecrementStock) {
				const itemRows = await tx
					.select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
					.from(orderItems)
					.where(eq(orderItems.orderId, internalOrderId));

				for (const itemRow of itemRows) {
					const variantId = itemRow.variantId;
					const quantity = itemRow.quantity ?? 0;
					if (!variantId || quantity <= 0) continue;

					const updatedRows = await tx
						.update(variants)
						.set({ stock: sql`${variants.stock} - ${quantity}` })
						.where(and(eq(variants.id, variantId), gte(variants.stock, quantity)))
						.returning({ id: variants.id });

					if (updatedRows.length === 0) {
						throw new StockInsufficientError('Stok varian tidak mencukupi untuk settlement.');
					}
				}
			}

			if (mappedOrderStatus && mappedOrderStatus !== orderRow.status) {
				await tx
					.update(orders)
					.set({ status: mappedOrderStatus })
					.where(eq(orders.id, internalOrderId));

				await tx.insert(orderStatusLogs).values({
					orderId: internalOrderId,
					status: mappedOrderStatus,
					changeBy: null
				});
			}

			return 200;
		});

		if (status === 404) {
			return json({ message: 'Order tidak ditemukan.' }, { status: 404 });
		}
	} catch (error) {
		if (error instanceof StockInsufficientError) {
			return json({ message: error.message }, { status: 409 });
		}

		throw error;
	}

	return json({ ok: true });
};
