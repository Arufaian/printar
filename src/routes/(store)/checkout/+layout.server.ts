import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime
} from '$lib/server/services/checkout-intent';
import type { LayoutServerLoad } from './$types';

const uuidSchema = z.uuid('ID checkout tidak valid.');

export const load: LayoutServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(
			303,
			`/sign-in?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`
		);
	}

	const intentId = event.url.searchParams.get('intentId')?.trim() ?? '';
	const parsedIntentId = uuidSchema.safeParse(intentId);

	if (!parsedIntentId.success) {
		throw redirect(303, '/cart');
	}

	try {
		const summary = await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);

		return {
			intentId: summary.intentId,
			orderId: summary.orderId,
			selectedItemIds: summary.selectedItemIds,
			selectedCount: summary.selectedCount,
			selectedSubtotal: summary.selectedSubtotal,
			shippingCost: summary.shippingCost,
			grandTotal: summary.grandTotal
		};
	} catch (err) {
		if (err instanceof CheckoutIntentError) {
			throw redirect(303, '/cart');
		}

		throw err;
	}
};
