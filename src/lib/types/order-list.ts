export type OrderStatusBadgeVariant =
	| 'default'
	| 'secondary'
	| 'destructive'
	| 'outline'
	| 'ghost'
	| 'link';

export type OrderPreviewItem = {
	id: string;
	name: string;
	variant: string;
	quantity: number;
	image: string | null;
};

export type OrderListItem = {
	id: string;
	status: string;
	createdAt: string | null;
	totalPrice: number;
	deliveryMethod: string | null;
	itemCount: number;
	latestPaymentStatus: string | null;
	previewItems: OrderPreviewItem[];
	remainingItemCount: number;
};
