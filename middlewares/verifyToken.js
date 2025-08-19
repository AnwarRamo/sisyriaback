import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const verifyToken = () => async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ code: "MISSING_TOKEN" });

    // Log token to ensure it's being sent correctly
    console.log("Received token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Log the decoded token to see its structure
    console.log("Decoded token:", decoded);

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({ code: "INVALID_TOKEN" });
    }

    const user = await User.findById(decoded.userId)
      .select("tokenVersion")
      .lean();

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401). json({ code: "INVALID_TOKEN" });
    }

    // Log the user to confirm we retrieved it correctly
    console.log("User from DB:", user);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ code: "TOKEN_EXPIRED" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ code: "INVALID_TOKEN" });
    }

    console.error("Authentication error:", error);  // Log any unexpected errors
    res.status(500).json({ code: "AUTH_ERROR" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ code: "ADMIN_REQUIRED" });
  }
  next();
};

// Optional auth: attaches req.user if token is valid; otherwise continues without error
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) return next();
    const user = await User.findById(decoded.userId).select('tokenVersion role').lean();
    if (!user || user.tokenVersion !== decoded.tokenVersion) return next();
    req.user = { userId: decoded.userId, role: decoded.role };
  } catch (err) {
    // Ignore errors and proceed unauthenticated
  } finally {
    next();
  }
};