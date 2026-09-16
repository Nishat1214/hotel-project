import express from "express";
import {
  registerUser,
  loginUser,
  createStaff,
  forgotPassword,
  resetPassword,
  getAllStaff,
  deleteStaff,
  getAllCustomers,
  getCustomerHistory,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/create-staff", protect, authorize("admin"), createStaff);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/staff", protect, authorize("admin"), getAllStaff);
router.delete("/staff/:id", protect, authorize("admin"), deleteStaff);
router.get("/customers", protect, authorize("admin", "receptionist"), getAllCustomers);
router.get("/customers/:id", protect, authorize("admin", "receptionist"), getCustomerHistory);

export default router;