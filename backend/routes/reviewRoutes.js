
import express from "express";

import {
    createReview,
    getRestaurantReviews,
    getMyReviews,
    updateReview,
    deleteReview,
    getAllReviewsForAdmin,
    adminDeleteReview
} from "../controllers/reviewController.js";

import {
    protect,
    authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: View restaurant reviews
router.get("/restaurant/:restaurantId", getRestaurantReviews);

// Customer: View own reviews
router.get(
    "/my-reviews",
    protect,
    authorizeRoles("customer"),
    getMyReviews
);

// Admin: View all reviews
router.get(
    "/admin",
    protect,
    authorizeRoles("admin"),
    getAllReviewsForAdmin
);

// Admin: Remove inappropriate review
router.delete(
    "/admin/:id",
    protect,
    authorizeRoles("admin"),
    adminDeleteReview
);

// Customer: Submit review
router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    createReview
);

// Customer: Update own review
router.put(
    "/:id",
    protect,
    authorizeRoles("customer"),
    updateReview
);

// Customer: Delete own review
router.delete(
    "/:id",
    protect,
    authorizeRoles("customer"),
    deleteReview
);

export default router;
