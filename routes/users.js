import express from "express";
import { verifyToken, isAdmin } from "../middlewares/verifyToken.js";
import { getUserProfile, updateCurrentUser, followUser } from "../controllers/user.controller.js";
import { addUser, getAllUsers, getUser, updateUser, deleteUser, promoteToAdmin } from "../controllers/userMangment.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
const router = express.Router();

// Protected user routes
router.use(verifyToken());
router.put("/me", updateCurrentUser);
router.get("/:username", getUserProfile);
router.put("/follow/:username", followUser);

// Admin user management
router.use(isAdmin);
router.post("/", addUser);
router.get("/", getAllUsers);
router.get("/:id", validateObjectId("id"), getUser);
router.put("/:id", validateObjectId("id"), updateUser);
router.delete("/:id", validateObjectId("id"), deleteUser);
router.put("/promote/:userId", validateObjectId("userId"), promoteToAdmin);

export default router; 