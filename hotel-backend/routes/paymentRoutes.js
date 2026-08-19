import express from "express";
import {
  getAllPayments,
  getPaymentByReservation,
  addAdditionalCharge,
  markPaymentPaid,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin", "receptionist"), getAllPayments);
router.get("/reservation/:reservationId", protect, getPaymentByReservation);
router.put("/:id/add-charge", protect, authorize("admin", "receptionist"), addAdditionalCharge);
router.put("/:id/mark-paid", protect, authorize("admin", "receptionist"), markPaymentPaid);
export default router;