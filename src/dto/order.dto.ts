export interface OrderItemDTO {
  sku_id: number;
  quantity: number;
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

export interface OrderDTO {
  delivery_type: DeliveryType;

  delivery_location: DeliveryLocationDTO;

  items: OrderItemDTO[];
}