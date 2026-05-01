export type CheckoutStepId = 'shipping' | 'review' | 'payment';

export type CheckoutStep = {
	id: CheckoutStepId;
	title: string;
	description: string;
	path: string;
};

export type CheckoutItem = {
	id: string;
	name: string;
	variant: string;
	quantity: number;
	unitPrice: number;
};

export type CheckoutAddress = {
	id: string;
	label: string;
	recipient: string;
	phone: string;
	addressLine: string;
	city: string;
	postalCode: string;
	isDefault?: boolean;
};

export type PaymentMethodId = 'bank_transfer' | 'e_wallet' | 'cod';

export type PaymentMethod = {
	id: PaymentMethodId;
	label: string;
	description: string;
};
