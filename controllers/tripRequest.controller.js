import Booking from '../models/Booking.model.js';
import { processDayFiles } from "../utils/processDayFiles.js";

// Helper function for authorization check
const checkOwnership = (design, userId) => {
  if (!design) {
    throw new Error('Design not found');
  }

  // When using .lean(), 'design.userId' is a plain object.
  // We need to access its '_id' property for the comparison.
  if (design.userId._id.toString() !== userId) {
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

    const tripDesign = await Booking.create({
      userId: req.user.userId,
      type: 'custom_trip_request',
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
    const designs = await Booking.find({ 
      userId: req.user.userId,
      type: 'custom_trip_request'
    })
      .sort('-createdAt')
      .populate('userId', 'username email')
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
    const design = await Booking.findById(req.params.id)
      .populate('userId', 'username email')
      .lean();

    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }

    // Check ownership
    checkOwnership(design, req.user.userId);

    return res.json({
      success: true,
      data: design
    });

  } catch (error) {
    console.error('❌ Get Design Details Error:', error);
    
    if (error.message === 'Design not found') {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }
    
    if (error.message === 'Unauthorized') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to get trip design details'
    });
  }
};

// Update trip design
export const updateTripDesign = async (req, res) => {
  try {
    const { id } = req.params;
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
      daysParsed = typeof days === 'string' ? JSON.parse(days) : days;
      
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

    const design = await Booking.findById(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }

    // Check ownership
    checkOwnership(design, req.user.userId);

    const processedDays = await processDayFiles(daysParsed, uploadedFiles);

    const updatedDesign = await Booking.findByIdAndUpdate(
      id,
      {
        title,
        days: processedDays,
        status: 'pending' // Reset to pending when updated
      },
      { new: true }
    ).populate('userId', 'username email');

    return res.json({
      success: true,
      data: updatedDesign
    });

  } catch (error) {
    console.error('❌ Update Trip Design Error:', error);
    
    if (error.message === 'Design not found') {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }
    
    if (error.message === 'Unauthorized') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update trip design'
    });
  }
};

// Review trip design (admin function)
export const reviewTripDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "approved" or "rejected"'
      });
    }

    const design = await Booking.findById(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }

    const updateData = {
      status,
      adminNote,
      approvedAt: status === 'approved' ? new Date() : undefined,
      rejectedAt: status === 'rejected' ? new Date() : undefined,
      approvedBy: status === 'approved' ? req.user.userId : undefined,
      rejectedBy: status === 'rejected' ? req.user.userId : undefined
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedDesign = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'username email');

    return res.json({
      success: true,
      data: updatedDesign
    });

  } catch (error) {
    console.error('❌ Review Trip Design Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to review trip design'
    });
  }
};

// Delete trip design
export const deleteTripDesign = async (req, res) => {
  try {
    const { id } = req.params;
    
    const design = await Booking.findById(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }

    // Check ownership
    checkOwnership(design, req.user.userId);

    await Booking.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Trip design deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete Trip Design Error:', error);
    
    if (error.message === 'Design not found') {
      return res.status(404).json({
        success: false,
        error: 'Trip design not found'
      });
    }
    
    if (error.message === 'Unauthorized') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to delete trip design'
    });
  }
};
