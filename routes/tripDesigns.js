import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { createTripDesign, getUserTripDesigns, getTripDesignDetails, updateTripDesign, deleteTripDesign } from "../controllers/tripRequest.controller.js";
const router = express.Router();

router.use(verifyToken());
router.route("/")
  .post(createTripDesign)
  .get(getUserTripDesigns);

router.route("/:id")
  .get(validateObjectId("id"), getTripDesignDetails)
  .put(validateObjectId("id"), updateTripDesign)
  .delete(validateObjectId("id"), deleteTripDesign);

export default router; 