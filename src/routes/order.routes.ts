import { Router } from "express";
import {
  createOrder,
  getOrder,
  cancelOrder,
  generatePickingLists,
} from "../controllers/order.controller";

const router = Router();

router.post("/", createOrder);
router.post("/picking-lists/generate", generatePickingLists);
router.get("/:orderId", getOrder);
router.delete("/:orderId", cancelOrder);

export default router;