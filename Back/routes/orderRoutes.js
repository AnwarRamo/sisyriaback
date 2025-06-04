// routes/orderRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js'; // Ensure path is correct
// Import controller functions
import {
  createOrder,
  getUserOrders,
  getOrderById
} from '../controllers/orderController.js'; // Adjust path if your controller is elsewhere

const router = express.Router();

// Create new order
router.post('/orders', verifyToken(), createOrder);

// Get logged in user orders
router.get('/orders', verifyToken(), getUserOrders);

// Get order by ID
router.get('/orders/:id', verifyToken(), getOrderById);

export default router;