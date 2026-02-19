import { Schema } from "mongoose";
import mongoose from "mongoose";

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref:"User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
followSchema.index({ follower: 1, following: 1 }, { unique: true }); // Prevent duplicate follows
followSchema.index({ follower: 1 }); // Get following list
followSchema.index({ following: 1 }); // Get followers list

export default mongoose.model("Follow", followSchema);