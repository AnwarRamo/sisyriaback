const TripSuggestion = require('../models/TripSuggestion');
const Trip = require('../models/Trip');

exports.suggestEdit = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const suggestedChanges = JSON.parse(req.body.payload);
    const suggestion = await TripSuggestion.create({
      user: req.user.id,
      trip: tripId,
      suggestedChanges,
    });
    res.status(201).json({ success: true, data: suggestion });
  } catch (err) { next(err); }
};

exports.getUserSuggestions = async (req, res, next) => {
  try {
    const suggestions = await TripSuggestion.find({ user: req.user.id })
      .populate('trip','title');
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
};

exports.adminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    const suggestion = await TripSuggestion.findByIdAndUpdate(id, { status }, { new: true });
    if (action === 'approve') {
      await Trip.findByIdAndUpdate(suggestion.trip, suggestion.suggestedChanges);
    }
    res.json({ success: true, data: suggestion });
  } catch (err) { next(err); }
};
