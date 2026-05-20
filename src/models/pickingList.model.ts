export interface PickingList {
  picking_list_id?: number;
  picking_list_status: "pending" | "failed" | "completed";
  warehouse_id: number;
}
