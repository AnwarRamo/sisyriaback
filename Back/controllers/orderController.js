import Order from '../models/order.js';
import Product from '../models/prudact.js'; // Ensure this path is correct
import mongoose from 'mongoose';

// @desc    Create new order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    if (!req.user || !req.user.userId) { // Assuming you fixed this to userId or _id based on verifyToken
      return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }
    const userIdFromToken = req.user.userId; // Or req.user._id

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided.' });
    }
    if (totalAmount === undefined || typeof totalAmount !== 'number' || totalAmount < 0) {
      return res.status(400).json({ message: 'Invalid total amount.' });
    }

    const populatedOrderItems = [];
    let calculatedServerSideTotal = 0;

    // Optional: Start a session for transaction (if your DB setup supports it)
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      for (const clientItem of items) {
        if (!clientItem.productId || !clientItem.quantity || clientItem.priceAtPurchase === undefined) {
          const err = new Error('Invalid item structure: productId, quantity, and priceAtPurchase are required.');
          err.statusCode = 400;
          throw err;
        }

        const product = await Product.findById(clientItem.productId); // .session(session) if using transactions

        if (!product) {
          const err = new Error(`Product with ID ${clientItem.productId} not found.`);
          err.statusCode = 404;
          throw err;
        }

        // *** ADDED FIX/CHECK FOR PRODUCT TITLE ***
        if (!product.title || product.title.trim() === "") {
          const err = new Error(
            `Product with ID ${clientItem.productId} has a missing or empty title in the database. Order item cannot be created.`
          );
          err.statusCode = 400; // Bad request as product data is unsuitable for order
          throw err;
        }
        // ****************************************

        const actualItemPrice = product.price;

        if (product.stock < clientItem.quantity) {
          const err = new Error(`Not enough stock for ${product.title}. Available: ${product.stock}, Requested: ${clientItem.quantity}`);
          err.statusCode = 400;
          throw err;
        }

        populatedOrderItems.push({
          productId: product._id,
          name: product.title, // Now we are more confident product.title exists and is not empty
          quantity: parseInt(clientItem.quantity, 10),
          priceAtPurchase: actualItemPrice,
        });

        calculatedServerSideTotal += actualItemPrice * parseInt(clientItem.quantity, 10);
      }

      if (Math.abs(calculatedServerSideTotal - parseFloat(totalAmount)) > 0.01) {
         const err = new Error(
           `Total amount mismatch. Client total: ${totalAmount}, Server calculated total: ${calculatedServerSideTotal.toFixed(2)}. Please refresh your cart.`
         );
         err.statusCode = 400;
         throw err;
      }

      const order = new Order({
        user: userIdFromToken,
        items: populatedOrderItems,
        totalAmount: calculatedServerSideTotal,
        status: 'Paid', // Or 'Pending'
      });

      const createdOrder = await order.save(/*{ session }*/);

      for (const item of populatedOrderItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity, soldCount: item.quantity }
        }/*, { session }*/);
      }

      // await session.commitTransaction(); // Commit transaction
      res.status(201).json(createdOrder);

    } catch (error) {
      // await session.abortTransaction(); // Abort transaction on error
      console.error('Error processing order items or during transaction:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      if (error.name === 'ValidationError') { // Mongoose validation error
          // This should ideally not be hit for the 'name' field if the above title check is effective
          return res.status(400).json({ message: "Order data validation failed", details: error.errors });
      }
      res.status(500).json({ message: 'Server error while creating order.', details: error.message });
    } finally {
      // if (session) session.endSession(); // End session
    }

  } catch (outerError) {
    console.error('Outer error in createOrder:', outerError);
    res.status(500).json({ message: 'Server error.', details: outerError.message });
  }
};

// @desc    Get logged in user orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) { // Or req.user._id depending on your verifyToken
      return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }
    const orders = await Order.find({ user: req.user.userId }) // Or req.user._id
      .populate('items.productId', 'name image price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders.', details: error.message });
  }
};

// @desc    Get order by ID
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) { // Or req.user._id
      return res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID format.' });
    }

    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.productId', 'name image price');

    if (order) {
      if (order.user._id.toString() !== req.user.userId.toString() /* && req.user.role !== 'admin' */) { // Or req.user._id
        return res.status(403).json({ message: 'Not authorized to view this order.' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found.' });
    }
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID format causing lookup failure.' });
    }
    res.status(500).json({ message: 'Server error while fetching order.', details: error.message });
  }
};