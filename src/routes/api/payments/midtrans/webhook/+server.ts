import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import {
	applyMidtransPaymentStatus,
	StockInsufficientError,
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

function resolveInternalOrderId(midtransOrderId: string): string | null {
	return z.uuid().safeParse(midtransOrderId).success ? midtransOrderId : null;
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

	const receivedAt = new Date().toISOString();
	const webhookPayloadRaw = typeof payload === 'object' && payload ? payload : {};

	try {
		const status = await db.transaction(async (tx) => {
			const [orderRow] = await tx
				.select({ id: orders.id })
				.from(orders)
				.where(eq(orders.id, internalOrderId))
				.limit(1);

			if (!orderRow?.id) return 404;

			const applied = await applyMidtransPaymentStatus(tx, {
				orderId: internalOrderId,
				transactionStatus: webhookPayload.transaction_status,
				paymentType: webhookPayload.payment_type ?? null,
				rawPayload: webhookPayloadRaw as Record<string, unknown>,
				receivedAt
			});

			if (!applied.paymentStatus) {
				return 400;
			}

			return 200;
		});

		if (status === 404) {
			return json({ message: 'Order tidak ditemukan.' }, { status: 404 });
		}

		if (status === 400) {
			return json({ message: 'Status transaksi Midtrans tidak didukung.' }, { status: 400 });
		}
	} catch (error) {
		if (error instanceof StockInsufficientError) {
			return json({ message: error.message }, { status: 409 });
		}

		throw error;
	}

	return json({ ok: true });
};
