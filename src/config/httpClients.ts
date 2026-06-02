import { OrderItemDTO } from "../dto/order.dto";

export interface InventoryReserveResult {
  success: boolean;
  reserved: OrderItemDTO[];
  failedItems: Array<OrderItemDTO & { reason: string }>;
}

export interface InventoryReleaseResult {
  success: boolean;
}

export const inventoryClient = {

  /**
   * Simulate reserving inventory in an external service.
   * @param warehouseId warehouse identifier
   * @param orderId order identifier
   * @param items items to reserve
   * @returns external reserve result stub
   */
  reserveInventory: async (
    warehouseId: number,
    orderId: number,
    items: OrderItemDTO[]
  ): Promise<InventoryReserveResult> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      reserved: items,
      failedItems: [],
    };
  },

  /**
   * Simulate releasing reserved inventory in an external service.
   * @param warehouseId warehouse identifier
   * @param items items to release
   * @returns external release result stub
   */
  releaseInventory: async (
    warehouseId: number,
    items: OrderItemDTO[]
  ): Promise<InventoryReleaseResult> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
    };
  },
};

export const warehouseStaffClient = {

  /**
   * Simulate notifying warehouse staff of a new picking task.
   * @param pickingListId picking list identifier
   * @returns notification result stub
   */
  notifyPickingTask: async (
    pickingListId: number
  ) => {
    await new Promise(
      resolve => setTimeout(resolve, 500)
    );

    return {
      success: true
    };
  }
};

export const dispatchClient = {

  /**
   * Simulate notifying dispatch that an order is ready.
   * @param orderId order identifier
   * @returns notification result stub
   */
  notifyDispatchReady: async (
    orderId: number
  ) => {
    await new Promise(
      resolve => setTimeout(resolve, 500)
    );

    return {
      success: true
    };
  }
};