import express from "express";
import {
  bookRoom,
  createWalkInBooking,
  getReservations,
  cancelReservation,
} from "../controllers/reservationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { checkInGuest, checkOutGuest, getCheckoutPreview } from "../controllers/checkInOutController.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), bookRoom);
router.post("/walkin", protect, authorize("admin", "receptionist"), createWalkInBooking);
router.get("/", protect, getReservations);
router.put("/:id/cancel", protect, authorize("admin", "receptionist"), cancelReservation);
router.put("/:id/checkin", protect, authorize("admin", "receptionist"), checkInGuest);
router.put("/:id/checkout", protect, authorize("admin", "receptionist"), checkOutGuest);
router.get("/:id/checkout-preview", protect, authorize("admin", "receptionist"), getCheckoutPreview);

export default router;