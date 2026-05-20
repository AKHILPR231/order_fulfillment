export interface Warehouse {
  warehouse_id?: number;
  warehouse_name: string;
  status: "active" | "not_active";
  effective_from: Date;
  address_id: number;
}
