
import express from "express";

import {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    assignRestaurantOwner,
    getMyRestaurants,
    getOwnerRestaurantReviews,
    ownerUpdateRestaurant,
    deleteRestaurant
} from "../controllers/restaurantController.js";

import {
    protect,
    authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getRestaurants);

// Owner routes
router.get(
    "/owner/my-restaurants",
    protect,
    authorizeRoles("owner"),
    getMyRestaurants
);

router.get(
    "/owner/:id/reviews",
    protect,
    authorizeRoles("owner"),
    getOwnerRestaurantReviews
);

router.put(
    "/owner/:id",
    protect,
    authorizeRoles("owner"),
    ownerUpdateRestaurant
);

// Admin routes
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createRestaurant
);

router.put(
    "/:id/assign-owner",
    protect,
    authorizeRoles("admin"),
    assignRestaurantOwner
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    updateRestaurant
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteRestaurant
);

// Public single restaurant route (keep after specific routes)
router.get("/:id", getRestaurantById);

export default router;
