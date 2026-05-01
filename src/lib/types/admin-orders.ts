export type AdminOrderListItem = {
	id: string;
	customerName: string;
	status: string;
	latestPaymentStatus: string | null;
	totalPrice: number;
	createdAt: string | null;
};

export type AdminOrderListFilters = {
	q: string;
	status: string;
	payment: string;
};

export type AdminOrderListData = {
	orders: AdminOrderListItem[];
	filters: AdminOrderListFilters;
};
