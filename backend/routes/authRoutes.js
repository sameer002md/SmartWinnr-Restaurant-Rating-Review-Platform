
import express from "express";

import {
    registerUser,
    loginUser
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Protected route - get logged-in user
router.get("/me", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authenticated user details retrieved successfully",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

export default router;
