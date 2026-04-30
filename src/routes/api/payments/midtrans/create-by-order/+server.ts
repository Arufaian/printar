import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orders, profiles } from '$lib/server/db/schema';
import { createSnapForOrder } from '$lib/server/services/payment/create-snap-order';
import type { RequestHandler } from './$types';

const requestSchema = z.object({
	orderId: z.uuid('ID pesanan tidak valid.')
});

const getClientFacingError = (message: string) => ({ message });

export const POST: RequestHandler = async (event) => {
	const { user } = await event.locals.safeGetSession();
	if (!user) {
		return json(getClientFacingError('Silakan login terlebih dahulu.'), { status: 401 });
	}

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return json(getClientFacingError('Payload request tidak valid.'), { status: 400 });
	}

	const parsedBody = requestSchema.safeParse(body);
	if (!parsedBody.success) {
		return json(getClientFacingError('ID pesanan tidak valid.'), { status: 400 });
	}

	const [ownedOrder] = await db
		.select({
			id: orders.id,
			status: orders.status,
			totalPrice: orders.totalPrice,
			profileName: profiles.name
		})
		.from(orders)
		.leftJoin(profiles, eq(orders.profileId, profiles.id))
		.where(and(eq(orders.id, parsedBody.data.orderId), eq(orders.profileId, user.id)))
		.limit(1);

	if (!ownedOrder) {
		return json(getClientFacingError('Pesanan tidak ditemukan.'), { status: 404 });
	}

	if (ownedOrder.status !== 'pending_payment') {
		return json(getClientFacingError('Pesanan ini tidak dapat diproses untuk pembayaran.'), {
			status: 409
		});
	}

	const grossAmount = ownedOrder.totalPrice ?? 0;
	if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
		return json(getClientFacingError('Total pembayaran tidak valid.'), { status: 400 });
	}

	const result = await createSnapForOrder({
		orderId: ownedOrder.id,
		grossAmount,
		origin: event.url.origin,
		callbacksPath: {
			finish: `/customer/orders/${ownedOrder.id}`,
			unfinish: `/customer/orders/${ownedOrder.id}`,
			error: `/customer/orders/${ownedOrder.id}`
		},
		customerFirstName: ownedOrder.profileName ?? undefined,
		itemName: `Order ${ownedOrder.id}`,
		statusBeforeCreate: ownedOrder.status,
		changeByUserId: user.id
	});

	return json(result.body, { status: result.status });
};
