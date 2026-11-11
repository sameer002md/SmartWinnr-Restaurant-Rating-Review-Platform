
import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin dashboard statistics
router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);

export default router;
