import TripRequest from '../models/TripRequest.js';
import { processDayFiles } from "../utils/processDayFiles.js";

// Helper function for authorization check
const checkOwnership = (design, userId) => {
  if (!design) {
    throw new Error('Design not found');
  }

  // When using .lean(), 'design.user' is a plain object.
  // We need to access its '_id' property for the comparison.
  if (design.user._id.toString() !== userId) {
    throw new Error('Unauthorized');
  }
};

// Create new trip design
// This function was already correct, with proper validation.
export const createTripDesign = async (req, res) => {
  try {
    const { title, days } = req.body;
    const uploadedFiles = req.files || [];

    // Validate required fields
    if (!title || !days) {
      return res.status(400).json({ 
        success: false,
        error: "Title and days are required" 
      });
    }

    let daysParsed;
    try {
      // Handle different input formats (e.g., JSON string from form-data)
      daysParsed = typeof days === 'string' ? JSON.parse(days) : days;
      
      // Ensure it's an array
      if (!Array.isArray(daysParsed)) {
        return res.status(400).json({
          success: false,
          error: "Days must be an array of day objects"
        });
      }
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return res.status(400).json({
        success: false,
        error: "Invalid days format. Must be valid JSON array"
      });
    }

    const processedDays = await processDayFiles(daysParsed, uploadedFiles);

    const tripDesign = await TripRequest.create({
      user: req.user.userId,
      title,
      days: processedDays,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      data: tripDesign
    });

  } catch (error) {
    console.error('❌ Create Trip Design Error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create trip design'
    });
  }
};

// Get all trip designs for user
export const getUserTripDesigns = async (req, res) => {
  try {
    const designs = await TripRequest.find({ user: req.user.userId })
      .sort('-createdAt')
      .populate('user', 'username email')
      .lean();

    return res.json({
      success: true,
      count: designs.length,
      data: designs
    });

  } catch (error) {
    console.error('❌ Get User Designs Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trip designs'
    });
  }
};

// Get single trip design
export const getTripDesignDetails = async (req, res) => {
  try {
    const design = await TripRequest.findById(req.params.id)
      .populate('user', 'username email')
      .lean();
      
    checkOwnership(design, req.user.userId);

    return res.json({
      success: true,
      data: design
    });

  } catch (error) {
    console.error('❌ Get Design Details Error:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 
                       error.message === 'Design not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get design details'
    });
  }
};

// Update trip design
// FIXED: This function now properly validates the 'days' field before updating.
export const updateTripDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, days } = req.body;
    const uploadedFiles = req.files || [];

    const design = await TripRequest.findById(id);
    checkOwnership(design, req.user.userId);

    // Update title if it was provided in the request
    if (title) {
      design.title = title;
    }

    // If 'days' data is present, parse, validate, and process it
    if (days) {
      let daysParsed;
      try {
        // Handle cases where 'days' is a JSON string (from multipart/form-data)
        daysParsed = typeof days === 'string' ? JSON.parse(days) : days;
        
        // Ensure the parsed data is an array before proceeding
        if (!Array.isArray(daysParsed)) {
          return res.status(400).json({
            success: false,
            error: "Days must be an array of day objects"
          });
        }
      } catch (parseError) {
        console.error('❌ JSON Parse Error in Update:', parseError);
        return res.status(400).json({
          success: false,
          error: "Invalid days format. Must be a valid JSON array"
        });
      }

      // Process files and update the days array
      const processedDays = await processDayFiles(daysParsed, uploadedFiles);
      design.days = processedDays;
    }

    design.status = 'pending'; // Reset status to pending on any update
    design.updatedAt = new Date(); // Explicitly set update time

    await design.save();

    return res.json({
      success: true,
      data: design
    });

  } catch (error) {
    console.error('❌ Update Design Error:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 
                       error.message === 'Design not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update trip design'
    });
  }
};


// Admin review
export const reviewTripDesign = async (req, res) => {
  try {
    const { status, adminComments } = req.body;
    const validStatuses = ['approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status. Must be either "approved" or "rejected"' 
      });
    }

    const design = await TripRequest.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ 
        success: false,
        error: 'Design not found' 
      });
    }

    design.status = status;
    design.adminComments = adminComments;
    design.reviewedAt = new Date();

    await design.save();

    return res.json({
      success: true,
      data: design
    });

  } catch (error) {
    console.error('❌ Review Design Error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to review design'
    });
  }
};

// Delete trip design
export const deleteTripDesign = async (req, res) => {
  try {
    const design = await TripRequest.findById(req.params.id);
    checkOwnership(design, req.user.userId);

    await design.deleteOne();

    return res.json({
      success: true,
      data: { id: req.params.id }
    });

  } catch (error) {
    console.error('❌ Delete Design Error:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 
                       error.message === 'Design not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete design'
    });
  }
};
