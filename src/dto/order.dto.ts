import { RowDataPacket } from "mysql2";

export interface OrderItemDTO {
  sku_id: number;
  quantity: number;
  price: number;
}

export interface DeliveryLocationDTO {
  latitude: number;
  longitude: number;
}

export type DeliveryType =
  | "speedpost"
  | "normal"
  | "dispatch"
  | "expressdelivery";

export interface OutOfStockItem {
  skuId: number;
  requested: number;
  available: number;
}

export interface ReservationResult {
  success: boolean;
  failedItems?: unknown[];
}

export interface CreateOrderResponse {
  orderId: number;
  fulfillmentStatus: string;
  reservationResult: ReservationResult;
  warning?: string;
}

export interface OrderDTO {
  delivery_type: DeliveryType;
  delivery_location: DeliveryLocationDTO;
  items: OrderItemDTO[];
}

export interface OrderRow extends RowDataPacket {
  order_id: number;
  order_date: string;
  fulfillment_status: string;
  delivery_type: string;
  warehouse_id: number;
  estimated_delivery_days: number;
  estimated_delivery_date: string;
}

export interface OrderItemRow extends RowDataPacket {
  sku_id: number;
  order_id: number;
  quantity: number;
  price: number;
  sku_description: string;
}