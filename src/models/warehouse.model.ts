export interface Warehouse {
  warehouse_id: number;

  warehouse_name: string;

  status: "active" | "not_active";

  latitude: number;

  longitude: number;

  effective_from: Date;

  address_id: number;
}
