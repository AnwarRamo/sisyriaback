import mongoose from "mongoose";
import User from "../models/user.model.js";
import Product from "../models/prudact.js";

// Error Codes
const CART_ERRORS = {
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  ITEM_NOT_IN_CART: "ITEM_NOT_IN_CART",
  EMPTY_CART: "EMPTY_CART",
  CHECKOUT_FAILED: "CHECKOUT_FAILED"
};

// Add to Cart with Stock Validation
export const addToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ code: "INVALID_PRODUCT_ID" });
    }

    const product = await Product.findById(productId).session(session);
    // const product = await Product.findById(mongoose.Types.ObjectId(productId)).session(session);

    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ code: CART_ERRORS.PRODUCT_NOT_FOUND });
    }

    const user = await User.findById(userId).session(session);
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId
    );

    // Calculate new quantity
    const newQty = existingItem ? existingItem.quantity + 1 : 1;
    
    if (newQty > product.stock) {
      await session.abortTransaction();
      return res.status(400).json({
        code: CART_ERRORS.INSUFFICIENT_STOCK,
        available: product.stock,
        currentInCart: existingItem?.quantity || 0
      });
    }

    if (existingItem) {
      existingItem.quantity = newQty;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save({ session });
    await session.commitTransaction();
    
    const updatedUser = await User.findById(userId).populate('cart.product');
    res.status(200).json({
      code: "CART_UPDATED",
      cart: updatedUser.cart
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({
      code: "SERVER_ERROR",
      message: err.message
    });
  } finally {
    session.endSession();
  }
};

// Update Cart Quantity
export const updateCartQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ code: CART_ERRORS.PRODUCT_NOT_FOUND });
    }

    if (quantity < 1 || quantity > product.stock) {
      await session.abortTransaction();
      return res.status(400).json({
        code: CART_ERRORS.INVALID_QUANTITY,
        min: 1,
        max: product.stock
      });
    }

    const user = await User.findById(userId).session(session);
    const itemIndex = user.cart.findIndex(item => 
      item.product.toString() === productId
    );

    if (itemIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({ code: CART_ERRORS.ITEM_NOT_IN_CART });
    }

    user.cart[itemIndex].quantity = quantity;
    await user.save({ session });
    await session.commitTransaction();

    const updatedUser = await User.findById(userId).populate('cart.product');
    res.status(200).json({
      code: "CART_UPDATED",
      cart: updatedUser.cart
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({
      code: "SERVER_ERROR",
      message: err.message
    });
  } finally {
    session.endSession();
  }
};

// Remove from Cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { cart: { product: productId } } },
      { new: true }
    ).populate('cart.product');

    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND" });

    res.status(200).json({
      code: "CART_UPDATED",
      cart: user.cart
    });
  } catch (err) {
    res.status(500).json({
      code: "SERVER_ERROR",
      message: err.message
    });
  }
};

// Checkout Cart
export const checkoutCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId)
      .populate('cart.product')
      .session(session);

    if (user.cart.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ code: CART_ERRORS.EMPTY_CART });
    }

    // Validate stock and prepare updates
    const bulkProductOps = [];
    const purchasedItems = [];

    for (const item of user.cart) {
      const product = item.product;
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          code: CART_ERRORS.INSUFFICIENT_STOCK,
          product: product.title,
          available: product.stock,
          requested: item.quantity
        });
      }

      bulkProductOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $inc: { stock: -item.quantity, soldCount: item.quantity }
          }
        }
      });

      purchasedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        purchasedAt: new Date()
      });
    }

    // Execute all product updates
    await Product.bulkWrite(bulkProductOps, { session });

    // Update user
    await User.findByIdAndUpdate(
      userId,
      {
        $push: { purchases: { $each: purchasedItems } },
        $set: { cart: [] }
      },
      { session }
    );

    await session.commitTransaction();
    
    res.status(200).json({
      code: "CHECKOUT_SUCCESS",
      purchasedItems: purchasedItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      }))
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({
      code: CART_ERRORS.CHECKOUT_FAILED,
      message: err.message
    });
  } finally {
    session.endSession();
  }
};

// Get Products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find(); // No stock condition
    res.status(200).json({
      code: "PRODUCTS_FETCHED",
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      code: "SERVER_ERROR",
      message: error.message
    });
  }
};
