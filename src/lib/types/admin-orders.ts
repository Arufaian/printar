export type AdminOrderListItem = {
	id: string;
	customerName: string;
	status: string;
	latestPaymentStatus: string | null;
	totalPrice: number;
	createdAt: string | null;
};

export type AdminOrderListFilters = {
	status: string;
	payment: string;
};

export type AdminOrderListData = {
	orders: AdminOrderListItem[];
	filters: AdminOrderListFilters;
};

export type AdminOrderDetailAddress = {
	recipientName: string;
	label: string;
	addressLine: string;
	city: string;
	postalCode: string;
	phone: string;
};

export type AdminOrderDetailItem = {
	id: string;
	name: string;
	variant: string;
	image: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	options: string[];
	filePath: string | null;
};

export type AdminOrderDetailTimelineEntry = {
	status: string;
	label: string;
	createdAt: string | null;
	changedByName: string | null;
};

export type AdminOrderDetailData = {
	id: string;
	orderCode: string;
	status: string;
	statusLabel: string;
	createdAt: string | null;
	updatedAt: string | null;
	deliveryMethod: string | null;
	deliveryMethodLabel: string;
	shippingCost: number;
	subtotal: number;
	grandTotal: number;
	customerNote: string | null;
	customerName: string;
	customerEmail: string | null;
	latestPaymentStatus: string | null;
	latestPaymentMethod: string | null;
	address: AdminOrderDetailAddress;
	items: AdminOrderDetailItem[];
	timeline: AdminOrderDetailTimelineEntry[];
};
