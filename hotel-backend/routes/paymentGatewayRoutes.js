import express from "express";
import {
  initSslcommerzPayment,
  initWalkInSslcommerzPayment,
  initBalanceSslcommerzPayment,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
} from "../controllers/paymentGatewayController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/sslcommerz/init", protect, authorize("customer"), initSslcommerzPayment);
router.post("/sslcommerz/init-walkin", protect, authorize("admin", "receptionist"), initWalkInSslcommerzPayment);
router.post("/sslcommerz/init-balance", protect, authorize("admin", "receptionist"), initBalanceSslcommerzPayment);

router.post("/sslcommerz/success", sslcommerzSuccess);
router.post("/sslcommerz/fail", sslcommerzFail);
router.post("/sslcommerz/cancel", sslcommerzCancel);

export default router;