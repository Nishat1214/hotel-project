import express from "express";
import {
  initSslcommerzPayment,
  initWalkInSslcommerzPayment,
  initBalanceSslcommerzPayment,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  processSslcommerzRefund,
} from "../controllers/paymentGatewayController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/sslcommerz/init", protect, authorize("customer"), initSslcommerzPayment);
router.post("/sslcommerz/init-walkin", protect, authorize("admin", "receptionist"), initWalkInSslcommerzPayment);
router.post("/sslcommerz/init-balance", protect, authorize("admin", "receptionist"), initBalanceSslcommerzPayment);
router.put("/sslcommerz/refund/:id", protect, authorize("admin", "receptionist"), processSslcommerzRefund);

router.post("/sslcommerz/success", sslcommerzSuccess);
router.post("/sslcommerz/fail", sslcommerzFail);
router.post("/sslcommerz/cancel", sslcommerzCancel);

export default router;