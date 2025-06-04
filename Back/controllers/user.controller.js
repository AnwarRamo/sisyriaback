
import User from "../models/user.model.js";
import Follow from "../models/follow.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { validationResult } from 'express-validator';
import cloudinary, { uploadToCloudinary } from '../utils/cloudinary.js';

// Helpers
const generateTokens = (user) => ({
  accessToken: jwt.sign(
    { userId: user._id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  ),
  refreshToken: jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/'
  };

  res.cookie('accessToken', accessToken, { ...options, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

// Auth Controllers
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, displayName, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(409).json({ code: "USER_EXISTS" });

    const user = await User.create({
      username: username.toLowerCase(),
      displayName: displayName?.trim() || username,
      email: email.toLowerCase(),
      hashedPassword: await bcrypt.hash(password, 10),
      role: (await User.countDocuments()) === 0 ? "admin" : "user",
      tokenVersion: 0
    });

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    const { hashedPassword, tokenVersion, ...userData } = user.toObject();
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ code: "REGISTRATION_ERROR" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+hashedPassword +tokenVersion');
    
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    const { hashedPassword, tokenVersion, ...userData } = user.toObject();
    res.json({ ...userData, accessTokenExpiry: Date.now() + 15 * 60 * 1000 });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR' });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({ message: "Logged out" });
};

export const refreshToken = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('tokenVersion role');

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN' });
    }

    const newAccessToken = generateTokens(user).accessToken;
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/'
    });

    res.json({ accessTokenExpiry: Date.now() + 15 * 60 * 1000 });
  } catch (error) {
    const code = error instanceof jwt.TokenExpiredError ? 'REFRESH_TOKEN_EXPIRED' : 
                 error instanceof jwt.JsonWebTokenError ? 'INVALID_REFRESH_TOKEN' : 'SERVER_ERROR';
    res.status(401).json({ code });
  }
};

// User Controllers
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-hashedPassword -tokenVersion -__v")
      .lean();

    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND" });

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id })
    ]);

    res.json({
      user: { ...user, avatar: user.avatar || null },
      stats: { followers: followerCount, following: followingCount }
    });
  } catch (error) {
    res.status(500).json({ code: "SERVER_ERROR" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: new RegExp(`^${req.params.username}$`, "i") })
      .select("-hashedPassword -__v")
      .lean();

    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND" });

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id })
    ]);

    const isFollowing = req.user?.userId ? 
      !!await Follow.exists({ follower: req.user.userId, following: user._id }) : 
      false;

    res.json({ ...user, followerCount, followingCount, isFollowing });
  } catch (error) {
    res.status(500).json({ code: "SERVER_ERROR" });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) return res.status(404).json({ code: "USER_NOT_FOUND" });
    if (req.user.userId === userToFollow._id.toString()) return res.status(400).json({ code: "SELF_FOLLOW" });

    const existingFollow = await Follow.findOneAndDelete({
      follower: req.user.userId,
      following: userToFollow._id
    });

    res.json({ code: existingFollow ? "FOLLOW_REMOVED" : "FOLLOW_ADDED" });
  } catch (error) {
    res.status(500).json({ code: "SERVER_ERROR" });
  }
};

// Admin Controllers
export const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role: "admin" }, $inc: { tokenVersion: 1 } },
      { new: true }
    );
    user ? res.sendStatus(204) : res.status(404).json({ code: "USER_NOT_FOUND" });
  } catch (error) {
    res.status(500).json({ code: "PROMOTION_ERROR" });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    res.json(await User.find({ role: "admin" }).select("-hashedPassword -tokenVersion -__v").lean());
  } catch (error) {
    res.status(500).json({ code: "SERVER_ERROR" });
  }
};

export const getAdminUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "admin" })
      .select("-hashedPassword -tokenVersion -__v")
      .lean();
    user ? res.json(user) : res.status(404).json({ code: "ADMIN_NOT_FOUND" });
  } catch (error) {
    error instanceof mongoose.Error.CastError 
      ? res.status(400).json({ code: "INVALID_ID" })
      : res.status(500).json({ code: "SERVER_ERROR" });
  }
};


// Update the current user
export const updateCurrentUser = async (req, res) => {
  try {
    // Get user id from the authenticated user
    const userId = req.user.userId; 

    // Get the updated data from the request body
    const updates = req.body;

    // If the password is being updated, hash it
    if (updates.password) {
      updates.hashedPassword = await bcrypt.hash(updates.password, 12);
      delete updates.password; // Remove plain password from updates
    }

    // Find the user by ID and update the fields
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true, // Return the updated document
      runValidators: true // Ensure that the updates pass the validation
    }).select('-hashedPassword -__v'); // Exclude sensitive fields like password and __v

    // If no user is found, send an error response
    if (!user) {
      return res.status(404).json({ code: 'USER_NOT_FOUND' });
    }

    // Send back the updated user data (without the password)
    res.json({ code: 'USER_UPDATED', user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ code: 'UPDATE_FAILED', message: error.message });
  }
};

export const someControllerFunction = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded or invalid buffer' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
};

export const addPreferredTripType = async (req, res) => {
  try {
    const userId = req.user.userId; // 🔁 fixed: userId matches what's in verifyToken
    const { tripType } = req.body;

    if (!tripType || typeof tripType !== 'string' || tripType.trim() === "") {
      return res.status(400).json({ 
        code: "INVALID_INPUT",
        message: "Trip type is required and must be a non-empty string." 
      });
    }

    const validTripTypes = ['Adventure', 'Cultural', 'Beach', 'Cruise', 'Family'];
    if (!validTripTypes.includes(tripType)) {
      return res.status(400).json({ 
        code: "INVALID_TRIP_TYPE",
        message: `Invalid trip type '${tripType}'. Allowed types are: ${validTripTypes.join(', ')}.` 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found." });
    }

    if (!user.preferredTripTypes) {
      user.preferredTripTypes = [];
    }

    if (!user.preferredTripTypes.includes(tripType)) {
      user.preferredTripTypes.push(tripType);
      await user.save();
      return res.status(200).json({
        code: "PREFERENCE_ADDED",
        message: "Preferred trip type added successfully.",
        preferredTripTypes: user.preferredTripTypes,
      });
    } else {
      return res.status(200).json({
        code: "PREFERENCE_ALREADY_EXISTS",
        message: "This trip type is already in your preferences.",
        preferredTripTypes: user.preferredTripTypes,
      });
    }
  } catch (error) {
    console.error("Error adding preferred trip type:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Failed to add trip type due to validation error.",
        errors: error.errors
      });
    }
    return res.status(500).json({ 
      code: "SERVER_ERROR",
      message: "Server error while adding preferred trip type.",
    });
  }
};
