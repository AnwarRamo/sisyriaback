import mongoose from "mongoose";

export const validateObjectId = (paramName = "id") => (req, res, next) => {
  const id = req.params[paramName];
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`Invalid ID: ${id} for parameter: ${paramName}`);
    return res.status(400).json({
      code: "INVALID_ID",
      message: `Invalid ID format for ${paramName} parameter`,
      receivedId: id,
      expectedFormat: "24-character hexadecimal string (0-9, a-f)"
    });
  }

  next();
};