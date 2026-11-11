
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Restaurant from "../models/Restaurant.js";

// ==========================================
// CUSTOMER: CREATE REVIEW
// ==========================================
export const createReview = async (req, res) => {
    try {
        // Support both restaurant and restaurantId
        const restaurant = req.body.restaurant || req.body.restaurantId;
        const { rating, comment } = req.body;

        if (!restaurant || rating === undefined || !comment) {
            return res.status(400).json({
                success: false,
                message: "Restaurant, rating and comment are required"
            });
        }

        if (!mongoose.isValidObjectId(restaurant)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a whole number between 1 and 5"
            });
        }

        if (
            typeof comment !== "string" ||
            comment.trim().length < 3 ||
            comment.trim().length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "Review must contain between 3 and 1000 characters"
            });
        }

        const existingRestaurant = await Restaurant.findOne({
            _id: restaurant,
            isActive: true
        });

        if (!existingRestaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        const review = await Review.create({
            customer: req.user._id,
            restaurant,
            rating,
            comment: comment.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this restaurant. Update your existing review instead."
            });
        }

        console.error("Create Review Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit review"
        });
    }
};

// ==========================================
// PUBLIC: GET REVIEWS FOR A RESTAURANT
// ==========================================
export const getRestaurantReviews = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        if (!mongoose.isValidObjectId(restaurantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const reviews = await Review.find({
            restaurant: restaurantId
        })
            .populate("customer", "name")
            .sort({ createdAt: -1 });

        const ratingSummary = await Review.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restaurantId)
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: ratingSummary.length
                ? Number(ratingSummary[0].averageRating.toFixed(1))
                : 0,
            reviews
        });

    } catch (error) {
        console.error("Get Restaurant Reviews Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reviews"
        });
    }
};

// ==========================================
// CUSTOMER: GET MY REVIEWS
// ==========================================
export const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            customer: req.user._id
        })
            .populate("restaurant", "name location cuisine")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error("Get My Reviews Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your reviews"
        });
    }
};

// ==========================================
// CUSTOMER: UPDATE OWN REVIEW
// ==========================================
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID"
            });
        }

        if (rating === undefined && comment === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide a rating or comment to update"
            });
        }

        const updates = {};

        if (rating !== undefined) {
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be a whole number between 1 and 5"
                });
            }

            updates.rating = rating;
        }

        if (comment !== undefined) {
            if (
                typeof comment !== "string" ||
                comment.trim().length < 3 ||
                comment.trim().length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Review must contain between 3 and 1000 characters"
                });
            }

            updates.comment = comment.trim();
        }

        const review = await Review.findOneAndUpdate(
            {
                _id: id,
                customer: req.user._id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you are not allowed to update it"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review
        });

    } catch (error) {
        console.error("Update Review Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update review"
        });
    }
};

// ==========================================
// CUSTOMER: DELETE OWN REVIEW
// ==========================================
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID"
            });
        }

        const review = await Review.findOneAndDelete({
            _id: id,
            customer: req.user._id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you are not allowed to delete it"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Delete Review Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete review"
        });
    }
};

// ==========================================
// ADMIN: GET ALL CUSTOMER REVIEWS
// ==========================================
export const getAllReviewsForAdmin = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("customer", "name email")
            .populate("restaurant", "name location cuisine")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error("Admin Get Reviews Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve all reviews"
        });
    }
};

// ==========================================
// ADMIN: DELETE INAPPROPRIATE REVIEW
// ==========================================
export const adminDeleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID"
            });
        }

        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Inappropriate review removed successfully"
        });

    } catch (error) {
        console.error("Admin Delete Review Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove review"
        });
    }
};
