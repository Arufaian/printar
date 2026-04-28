import {
	CHECKOUT_ADDRESSES,
	CHECKOUT_ITEMS,
	CHECKOUT_STEPS,
	DEFAULT_SHIPPING_COST,
	PAYMENT_METHODS
} from '../constants';
import { getSubtotal } from '$lib/utils/string';
import type { CheckoutStepId, PaymentMethodId } from '$lib/types/checkout';

const addressState = $state({
	selectedAddressId: CHECKOUT_ADDRESSES.find((address) => address.isDefault)?.id ?? ''
});

const paymentState = $state({
	selectedPaymentMethodId: '' as PaymentMethodId | ''
});

const noteState = $state({
	customerNote: ''
});

const cartState = $state({
	items: CHECKOUT_ITEMS,
	shippingCost: DEFAULT_SHIPPING_COST
});

const stepIndexMap = new Map(CHECKOUT_STEPS.map((step, index) => [step.id, index + 1]));

export const checkoutDraft = {
	steps: CHECKOUT_STEPS,
	addresses: CHECKOUT_ADDRESSES,
	paymentMethods: PAYMENT_METHODS,
	get items() {
		return cartState.items;
	},
	get selectedAddressId() {
		return addressState.selectedAddressId;
	},
	set selectedAddressId(value: string) {
		addressState.selectedAddressId = value;
	},
	get selectedPaymentMethodId() {
		return paymentState.selectedPaymentMethodId;
	},
	set selectedPaymentMethodId(value: PaymentMethodId | '') {
		paymentState.selectedPaymentMethodId = value;
	},
	get customerNote() {
		return noteState.customerNote;
	},
	set customerNote(value: string) {
		noteState.customerNote = value;
	},
	get shippingCost() {
		return cartState.shippingCost;
	},
	get subtotal() {
		return getSubtotal(cartState.items);
	},
	get total() {
		return getSubtotal(cartState.items) + cartState.shippingCost;
	},
	getStepFromPathname(pathname: string): CheckoutStepId {
		const step = CHECKOUT_STEPS.find((item) => pathname.startsWith(item.path));
		return step?.id ?? 'shipping';
	},
	getStepNumber(stepId: CheckoutStepId): number {
		return stepIndexMap.get(stepId) ?? 1;
	},
	getPreviousPath(stepId: CheckoutStepId): string | null {
		const currentIndex = CHECKOUT_STEPS.findIndex((step) => step.id === stepId);
		if (currentIndex <= 0) return null;
		return CHECKOUT_STEPS[currentIndex - 1].path;
	},
	getNextPath(stepId: CheckoutStepId): string | null {
		const currentIndex = CHECKOUT_STEPS.findIndex((step) => step.id === stepId);
		if (currentIndex < 0 || currentIndex === CHECKOUT_STEPS.length - 1) return null;
		return CHECKOUT_STEPS[currentIndex + 1].path;
	},
	canProceedFromStep(stepId: CheckoutStepId): boolean {
		if (stepId === 'shipping') return Boolean(addressState.selectedAddressId);
		if (stepId === 'payment') return Boolean(paymentState.selectedPaymentMethodId);
		return true;
	}
};
