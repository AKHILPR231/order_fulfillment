export interface Orders {
  order_id?: number;
  order_date: Date;

  fulfillment_status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

  delivery_type: "speedpost" | "normal" | "dispatch" | "expressdelivery";

  warehouse_id: number;

  estimated_delivery_days: number;

  estimated_delivery_date: Date;
}
