import express from "express";
import {
  submitComplaint,
  getComplaints,
  updateComplaint,
  closeComplaint,
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), submitComplaint);
router.get("/", protect, getComplaints);
router.put("/:id", protect, authorize("admin", "receptionist"), updateComplaint);
router.put("/:id/close", protect, authorize("admin", "receptionist"), closeComplaint);

export default router;