import express from "express";
import {
  getReservationReport,
  getRevenueReport,
  getOccupancyReport,
  getComplaintReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/reservations", protect, authorize("admin"), getReservationReport);
router.get("/revenue", protect, authorize("admin"), getRevenueReport);
router.get("/occupancy", protect, authorize("admin"), getOccupancyReport);
router.get("/complaints", protect, authorize("admin"), getComplaintReport);

export default router;