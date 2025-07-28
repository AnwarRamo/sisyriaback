import express from "express";
import { registerUser, loginUser, logoutUser, refreshToken, getCurrentUser } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validateUserRegistration, validateUserLogin } from "../validators/auth.js";
const router = express.Router();

// Public
router.post("/register", validateUserRegistration, registerUser);
router.post("/login", validateUserLogin, loginUser);
router.post("/refresh", refreshToken);

// Protected
router.use(verifyToken());
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);

export default router; 