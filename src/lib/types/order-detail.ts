import type { OrderStatusBadgeVariant } from './order-list';

export type OrderDetailAddress = {
	recipientName: string;
	label: string;
	addressLine: string;
	city: string;
	postalCode: string;
	phone: string;
};

export type OrderDetailItem = {
	id: string;
	name: string;
	variant: string;
	image: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	options: string[];
};

export type OrderDetailTimelineEntry = {
	status: string;
	label: string;
	createdAt: string | null;
	changedByName: string | null;
};

export type OrderDetailData = {
	id: string;
	orderCode: string;
	status: string;
	statusLabel: string;
	statusBadgeVariant: OrderStatusBadgeVariant;
	statusBadgeClass: string;
	createdAt: string | null;
	deliveryMethod: string | null;
	shippingCost: number;
	subtotal: number;
	grandTotal: number;
	customerNote: string | null;
	latestPaymentStatus: string | null;
	latestPaymentMethod: string | null;
	address: OrderDetailAddress;
	items: OrderDetailItem[];
	timeline: OrderDetailTimelineEntry[];
};
