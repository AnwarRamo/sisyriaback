// services/dashboard.service.js
export const getDashboardStats = async () => {
    return {
      totalUsers: await User.countDocuments(),
      activeTrips: await Trip.countDocuments({ status: 'active' }),
      totalRevenue: await Trip.aggregate([...]),
      userGrowth: await getGrowthRates()
    };
  };