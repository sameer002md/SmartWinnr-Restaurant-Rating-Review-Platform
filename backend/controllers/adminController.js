
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin only

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalOwners,
      totalRestaurants,
      totalReviews,
      ratingResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "owner" }),
      Restaurant.countDocuments(),
      Review.countDocuments(),
      Review.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" }
          }
        }
      ])
    ]);

    const averageRating = ratingResult.length
      ? Number(ratingResult[0].averageRating.toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalOwners,
        totalRestaurants,
        totalReviews,
        averageRating
      }
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics",
      error: error.message
    });
  }
};
