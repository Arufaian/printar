import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema';
import { applyMidtransPaymentStatus } from './apply-midtrans-payment-status';
import { getMidtransTransactionStatus } from './midtrans.js';

export async function syncMidtransOrderStatus(orderId: string) {
	const [orderRow] = await db
		.select({ id: orders.id, status: orders.status })
		.from(orders)
		.where(eq(orders.id, orderId))
		.limit(1);

	if (!orderRow?.id || orderRow.status !== 'pending_payment') {
		return { skipped: true as const };
	}

	const [latestPayment] = await db
		.select({ status: payments.status })
		.from(payments)
		.where(eq(payments.orderId, orderId))
		.limit(1);

	if (latestPayment?.status && latestPayment.status !== 'pending') {
		return { skipped: true as const };
	}

	const midtransStatus = (await getMidtransTransactionStatus(orderId)) as Record<string, unknown>;
	const transactionStatus =
		typeof midtransStatus.transaction_status === 'string'
			? midtransStatus.transaction_status
			: null;

	if (!transactionStatus) {
		return { skipped: true as const };
	}

	const statusCode =
		typeof midtransStatus.status_code === 'string' ? midtransStatus.status_code : '200';
	const grossAmount =
		typeof midtransStatus.gross_amount === 'string' ? midtransStatus.gross_amount : '0';

	await db.transaction(async (tx) => {
		await applyMidtransPaymentStatus(tx, {
			orderId,
			transactionStatus,
			paymentType:
				typeof midtransStatus.payment_type === 'string' ? midtransStatus.payment_type : null,
			rawPayload: {
				...midtransStatus,
				order_id: orderId,
				status_code: statusCode,
				gross_amount: grossAmount
			},
			receivedAt: new Date().toISOString()
		});
	});

	return { skipped: false as const };
}
