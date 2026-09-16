import express from "express";
import {
  bookRoom,
  createWalkInBooking,
  getReservations,
  cancelReservation,
  modifyReservationDates,
  changeReservationRoom,
} from "../controllers/reservationController.js";
import {
  checkInGuest,
  getCheckoutPreview,
  checkOutGuest,
} from "../controllers/checkInOutController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), bookRoom);
router.post("/walkin", protect, authorize("admin", "receptionist"), createWalkInBooking);
router.get("/", protect, getReservations);
router.put("/:id/cancel", protect, authorize("admin", "receptionist"), cancelReservation);
router.put("/:id/modify-dates", protect, authorize("admin", "receptionist"), modifyReservationDates);
router.put("/:id/change-room", protect, authorize("admin", "receptionist"), changeReservationRoom);
router.put("/:id/checkin", protect, authorize("admin", "receptionist"), checkInGuest);
router.get("/:id/checkout-preview", protect, authorize("admin", "receptionist"), getCheckoutPreview);
router.put("/:id/checkout", protect, authorize("admin", "receptionist"), checkOutGuest);

export default router;