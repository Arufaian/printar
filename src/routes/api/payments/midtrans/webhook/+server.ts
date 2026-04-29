import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orderStatusLogs, orders, payments } from '$lib/server/db/schema';
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
	const internalOrderId = midtransOrderId.replace(/-\d{14}$/, '');
	return z.uuid().safeParse(internalOrderId).success ? internalOrderId : null;
}

function mapTransactionStatusToPaymentStatus(transactionStatus: string) {
	const normalized = transactionStatus.toLowerCase();
	const parsed = paymentStatusSchema.safeParse(normalized);
	return parsed.success ? parsed.data : null;
}

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

	const [orderRow] = await db
		.select({ id: orders.id, status: orders.status })
		.from(orders)
		.where(eq(orders.id, internalOrderId))
		.limit(1);

	if (!orderRow?.id) {
		return json({ message: 'Order tidak ditemukan.' }, { status: 404 });
	}

	const paymentStatus = mapTransactionStatusToPaymentStatus(webhookPayload.transaction_status);
	if (!paymentStatus) {
		return json({ message: 'Status transaksi Midtrans tidak didukung.' }, { status: 400 });
	}

	const rawResponse = {
		...(typeof payload === 'object' && payload ? payload : {}),
		received_at: new Date().toISOString()
	};

	const [existingPayment] = await db
		.select({ id: payments.id })
		.from(payments)
		.where(eq(payments.orderId, internalOrderId))
		.limit(1);

	if (existingPayment?.id) {
		await db
			.update(payments)
			.set({
				status: paymentStatus,
				paymentMethod: webhookPayload.payment_type ?? null,
				rawResponse
			})
			.where(eq(payments.id, existingPayment.id));
	} else {
		await db.insert(payments).values({
			orderId: internalOrderId,
			status: paymentStatus,
			paymentMethod: webhookPayload.payment_type ?? null,
			rawResponse
		});
	}

	const mappedOrderStatus = mapMidtransStatusToOrderStatus(webhookPayload.transaction_status);
	if (mappedOrderStatus && mappedOrderStatus !== orderRow.status) {
		await db
			.update(orders)
			.set({ status: mappedOrderStatus })
			.where(eq(orders.id, internalOrderId));

		await db.insert(orderStatusLogs).values({
			orderId: internalOrderId,
			status: mappedOrderStatus,
			changeBy: null
		});
	}

	return json({ ok: true });
};
