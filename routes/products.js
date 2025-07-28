import express from "express";
import { getAllProducts } from "../controllers/cart.controller.js";
const router = express.Router();

router.get("/", getAllProducts);

export default router; 