import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createOrder, getUserOrders, getOrderById } from "../controllers/orderController.js";
const router = express.Router();

router.use(verifyToken());
router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);

export default router; 