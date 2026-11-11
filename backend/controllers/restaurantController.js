
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

// GET ALL RESTAURANTS + SEARCH + FILTER
export const getRestaurants = async (req, res) => {
    try {
        const { search, location, cuisine } = req.query;
        const filter = { isActive: true };

        if (search) filter.name = { $regex: search, $options: "i" };
        if (location) filter.location = { $regex: location, $options: "i" };
        if (cuisine) filter.cuisine = { $regex: cuisine, $options: "i" };

        const restaurants = await Restaurant.find(filter)
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        const restaurantIds = restaurants.map(r => r._id);

        const ratings = await Review.aggregate([
            { $match: { restaurant: { $in: restaurantIds } } },
            {
                $group: {
                    _id: "$restaurant",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const result = restaurants.map(restaurant => {
            const rating = ratings.find(
                item => item._id.toString() === restaurant._id.toString()
            );

            return {
                ...restaurant.toObject(),
                averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
                totalReviews: rating ? rating.totalReviews : 0
            };
        });

        res.status(200).json({
            success: true,
            count: result.length,
            restaurants: result
        });
    } catch (error) {
        console.error("Get Restaurants Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve restaurants"
        });
    }
};

// GET SINGLE RESTAURANT
export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({
            _id: req.params.id,
            isActive: true
        }).populate("owner", "name email");

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        const rating = await Review.aggregate([
            { $match: { restaurant: restaurant._id } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            restaurant: {
                ...restaurant.toObject(),
                averageRating: rating.length
                    ? Number(rating[0].averageRating.toFixed(1))
                    : 0,
                totalReviews: rating.length ? rating[0].totalReviews : 0
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid restaurant ID"
        });
    }
};

// CREATE RESTAURANT
export const createRestaurant = async (req, res) => {
    try {
        const {
            name, location, cuisine, description, address, phone, owner
        } = req.body;

        if (!name || !location || !cuisine) {
            return res.status(400).json({
                success: false,
                message: "Name, location and cuisine are required"
            });
        }

        if (owner) {
            const ownerUser = await User.findOne({
                _id: owner,
                role: "owner",
                isActive: true
            });

            if (!ownerUser) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or inactive restaurant owner"
                });
            }
        }

        const restaurant = await Restaurant.create({
            name, location, cuisine, description, address, phone,
            owner: owner || null
        });

        res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            restaurant
        });
    } catch (error) {
        console.error("Create Restaurant Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ADMIN: UPDATE RESTAURANT DETAILS
export const updateRestaurant = async (req, res) => {
    try {
        const allowedFields = [
            "name", "location", "cuisine",
            "description", "address", "phone"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ADMIN: ASSIGN OR CHANGE RESTAURANT OWNER
export const assignRestaurantOwner = async (req, res) => {
    try {
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "Owner ID is required"
            });
        }

        const owner = await User.findOne({
            _id: ownerId,
            role: "owner",
            isActive: true
        });

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Active restaurant owner not found"
            });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { owner: owner._id },
            { new: true, runValidators: true }
        ).populate("owner", "name email");

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant owner assigned successfully",
            restaurant
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid restaurant or owner ID"
        });
    }
};

// OWNER: VIEW ASSIGNED RESTAURANTS
export const getMyRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            owner: req.user._id,
            isActive: true
        }).sort({ createdAt: -1 });

        const restaurantIds = restaurants.map(r => r._id);

        const ratings = await Review.aggregate([
            { $match: { restaurant: { $in: restaurantIds } } },
            {
                $group: {
                    _id: "$restaurant",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const result = restaurants.map(restaurant => {
            const rating = ratings.find(
                item => item._id.toString() === restaurant._id.toString()
            );

            return {
                ...restaurant.toObject(),
                averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
                totalReviews: rating ? rating.totalReviews : 0
            };
        });

        res.status(200).json({
            success: true,
            count: result.length,
            restaurants: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve assigned restaurants"
        });
    }
};

// OWNER: VIEW REVIEWS FOR OWN RESTAURANT
export const getOwnerRestaurantReviews = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({
            _id: req.params.id,
            owner: req.user._id,
            isActive: true
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or access denied"
            });
        }

        const reviews = await Review.find({
            restaurant: restaurant._id
        })
            .populate("customer", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            restaurant: restaurant.name,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid restaurant ID"
        });
    }
};

// OWNER: UPDATE OWN RESTAURANT DETAILS
export const ownerUpdateRestaurant = async (req, res) => {
    try {
        const allowedFields = [
            "description", "address", "phone"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No permitted fields provided for update"
            });
        }

        const restaurant = await Restaurant.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id,
                isActive: true
            },
            updates,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant details updated successfully",
            restaurant
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ADMIN: DELETE RESTAURANT (SOFT DELETE)
export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid restaurant ID"
        });
    }
};
