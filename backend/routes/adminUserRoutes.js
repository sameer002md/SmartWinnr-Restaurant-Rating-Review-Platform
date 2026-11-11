import express from "express";
import {
  getAllUsers,
  createOwnerAccount,
  updateUserStatus
} from "../controllers/adminUserController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/", getAllUsers);
router.post("/owners", createOwnerAccount);
router.patch("/:id/status", updateUserStatus);

export default router;