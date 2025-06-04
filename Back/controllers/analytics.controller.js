// controllers/analytics.controller.js
export const getUsersAnalytics = async (req, res) => {
    try {
      const data = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } }
          }
        }
      ]);
      
      res.json(data[0] || {});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const getTripsAnalytics = async (req, res) => {
    try {
      const data = await Trip.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$price" }
          }
        }
      ]);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const getRevenueAnalytics = async (req, res) => {
    try {
      const data = await Trip.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalRevenue: { $sum: "$price" },
            tripsCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };