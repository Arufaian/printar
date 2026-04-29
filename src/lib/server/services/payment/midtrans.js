import midtransClient from 'midtrans-client';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

if (!MIDTRANS_SERVER_KEY) {
	throw new Error('[midtrans] MIDTRANS_SERVER_KEY is not configured.');
}

const snapClient = new midtransClient.Snap({
	isProduction: MIDTRANS_IS_PRODUCTION,
	serverKey: MIDTRANS_SERVER_KEY
});

/**
 * @typedef {{
 * 	firstName?: string;
 * 	lastName?: string;
 * 	email?: string;
 * 	phone?: string;
 * }} MidtransCustomer
 */

/**
 * @typedef {{
 * 	id: string;
 * 	price: number;
 * 	quantity: number;
 * 	name: string;
 * }} MidtransItemDetail
 */

/**
 * @typedef {{
 * 	finish?: string;
 * 	unfinish?: string;
 * 	error?: string;
 * }} MidtransCallbacks
 */

/**
 * @typedef {{
 * 	orderId: string;
 * 	grossAmount: number;
 * 	customer?: MidtransCustomer;
 * 	itemDetails?: MidtransItemDetail[];
 * 	callbacks?: MidtransCallbacks;
 * }} CreateSnapTransactionParams
 */

/**
 * @param {CreateSnapTransactionParams} params
 */
function assertCreateTransactionParams(params) {
	if (!params.orderId?.trim()) {
		throw new Error('[midtrans] orderId is required to create transaction.');
	}

	if (!Number.isFinite(params.grossAmount) || params.grossAmount <= 0) {
		throw new Error('[midtrans] grossAmount must be a positive number.');
	}
}

/**
 * @param {CreateSnapTransactionParams} params
 */
export async function createSnapTransaction(params) {
	assertCreateTransactionParams(params);

	const payload = {
		transaction_details: {
			order_id: params.orderId,
			gross_amount: Math.round(params.grossAmount)
		},
		customer_details: params.customer,
		item_details: params.itemDetails,
		callbacks: params.callbacks
	};

	try {
		const response = await snapClient.createTransaction(payload);
		return {
			token: response?.token ?? null,
			redirect_url: response?.redirect_url ?? null,
			rawResponse: response
		};
	} catch (error) {
		console.error('[midtrans] createTransaction failed', error);
		throw new Error('[midtrans] failed to create transaction.');
	}
}

/**
 * @param {string | null | undefined} transactionStatus
 */
export function mapMidtransStatusToOrderStatus(transactionStatus) {
	switch ((transactionStatus ?? '').toLowerCase()) {
		case 'pending':
			return 'pending_payment';
		case 'settlement':
			return 'paid';
		case 'expire':
		case 'cancel':
			return 'draft';
		default:
			return null;
	}
}

/**
 * @param {string | null | undefined} transactionStatus
 */
export function isFinalMidtransStatus(transactionStatus) {
	const normalized = (transactionStatus ?? '').toLowerCase();
	return normalized === 'settlement' || normalized === 'expire' || normalized === 'cancel';
}
