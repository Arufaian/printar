import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderStatusLogs, orders, payments } from '$lib/server/db/schema';
import { createSnapTransaction } from './midtrans.js';

export const DUPLICATE_NO_REUSABLE_TOKEN_CODE = 'MIDTRANS_DUPLICATE_NO_REUSABLE_TOKEN';

type CreateSnapOrderParams = {
	orderId: string;
	grossAmount: number;
	origin: string;
	callbacksPath: {
		finish: string;
		unfinish: string;
		error: string;
	};
	customerFirstName?: string;
	itemName: string;
	statusBeforeCreate: string;
	changeByUserId?: string | null;
};

type CreateSnapOrderSuccess = {
	status: 200;
	body: {
		snapToken: string;
		redirectUrl: string | null;
		orderId: string;
		reused: boolean;
	};
};

type CreateSnapOrderFailure = {
	status: 409 | 502;
	body: {
		message: string;
		code?: string;
	};
};

export type CreateSnapOrderResult = CreateSnapOrderSuccess | CreateSnapOrderFailure;

const isMidtransDuplicateOrderIdError = (error: unknown) => {
	if (!error || typeof error !== 'object' || !('midtransErrorMessages' in error)) {
		return false;
	}

	const messages = (error as { midtransErrorMessages?: unknown }).midtransErrorMessages;
	if (!Array.isArray(messages)) {
		return false;
	}

	return (
		messages.some((message) => {
			if (typeof message !== 'string') return false;
			const normalized = message.toLowerCase();
			return normalized.includes('order_id') && normalized.includes('already been taken');
		}) ||
		messages.some((message) => {
			if (typeof message !== 'string') return false;
			const normalized = message.toLowerCase();
			return normalized.includes('order_id') && normalized.includes('sudah digunakan');
		})
	);
};

const getReusableSnapPayload = (rawResponse: unknown) => {
	if (!rawResponse || typeof rawResponse !== 'object') return null;

	const token = (rawResponse as Record<string, unknown>).token;
	if (typeof token !== 'string' || token.length === 0) return null;

	const redirectUrl = (rawResponse as Record<string, unknown>).redirect_url;

	return {
		snapToken: token,
		redirectUrl: typeof redirectUrl === 'string' ? redirectUrl : null
	};
};

export const createSnapForOrder = async (
	params: CreateSnapOrderParams
): Promise<CreateSnapOrderResult> => {
	const callbacks = {
		finish: `${params.origin}${params.callbacksPath.finish}`,
		unfinish: `${params.origin}${params.callbacksPath.unfinish}`,
		error: `${params.origin}${params.callbacksPath.error}`
	};

	let midtransResponse: Awaited<ReturnType<typeof createSnapTransaction>>;

	try {
		midtransResponse = await createSnapTransaction({
			orderId: params.orderId,
			grossAmount: params.grossAmount,
			customer: {
				firstName: params.customerFirstName
			},
			itemDetails: [
				{
					id: params.orderId,
					name: params.itemName,
					quantity: 1,
					price: params.grossAmount
				}
			],
			callbacks
		});
	} catch (error) {
		if (isMidtransDuplicateOrderIdError(error)) {
			const [existingPayment] = await db
				.select({ rawResponse: payments.rawResponse })
				.from(payments)
				.where(eq(payments.orderId, params.orderId))
				.limit(1);

			const reusableSnapPayload = getReusableSnapPayload(existingPayment?.rawResponse ?? null);
			const raw = existingPayment?.rawResponse as Record<string, unknown> | null | undefined;
			console.warn('[midtrans:create] duplicate order_id detected', {
				orderId: params.orderId,
				hasStoredToken: typeof raw?.token === 'string' && raw.token.length > 0,
				hasStoredRedirectUrl: typeof raw?.redirect_url === 'string' && raw.redirect_url.length > 0
			});
			if (reusableSnapPayload) {
				return {
					status: 200,
					body: {
						...reusableSnapPayload,
						orderId: params.orderId,
						reused: true
					}
				};
			}

			return {
				status: 409,
				body: {
					message: 'Transaksi untuk pesanan ini sudah pernah dibuat. Coba beberapa saat lagi.',
					code: DUPLICATE_NO_REUSABLE_TOKEN_CODE
				}
			};
		}

		console.error('[midtrans:create] failed to create transaction', error);

		return {
			status: 502,
			body: {
				message: 'Gagal membuat transaksi pembayaran.'
			}
		};
	}

	const rawResponsePayload = {
		...(midtransResponse.rawResponse ?? {}),
		midtrans_order_id: params.orderId
	};

	const [existingPayment] = await db
		.select({ id: payments.id })
		.from(payments)
		.where(eq(payments.orderId, params.orderId))
		.limit(1);

	if (existingPayment?.id) {
		await db
			.update(payments)
			.set({
				status: 'pending',
				paymentMethod:
					typeof midtransResponse.rawResponse?.payment_type === 'string'
						? midtransResponse.rawResponse.payment_type
						: null,
				rawResponse: rawResponsePayload
			})
			.where(eq(payments.id, existingPayment.id));
	} else {
		await db.insert(payments).values({
			orderId: params.orderId,
			status: 'pending',
			paymentMethod:
				typeof midtransResponse.rawResponse?.payment_type === 'string'
					? midtransResponse.rawResponse.payment_type
					: null,
			rawResponse: rawResponsePayload
		});
	}

	if (params.statusBeforeCreate !== 'pending_payment') {
		await db.update(orders).set({ status: 'pending_payment' }).where(eq(orders.id, params.orderId));

		const [existingPendingLog] = await db
			.select({ id: orderStatusLogs.id })
			.from(orderStatusLogs)
			.where(
				and(
					eq(orderStatusLogs.orderId, params.orderId),
					eq(orderStatusLogs.status, 'pending_payment')
				)
			)
			.limit(1);

		if (!existingPendingLog?.id) {
			await db.insert(orderStatusLogs).values({
				orderId: params.orderId,
				status: 'pending_payment',
				changeBy: params.changeByUserId ?? null
			});
		}
	}

	return {
		status: 200,
		body: {
			snapToken: midtransResponse.token,
			redirectUrl: midtransResponse.redirect_url,
			orderId: params.orderId,
			reused: false
		}
	};
};
