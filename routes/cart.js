import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { addToCart, removeFromCart, updateCartQuantity, checkoutCart } from "../controllers/cart.controller.js";
const router = express.Router();

router.use(verifyToken());
router.post("/add", addToCart);
router.delete("/remove/:productId", removeFromCart);
router.put("/update/:productId", updateCartQuantity);
router.post("/checkout", checkoutCart);

export default router; 