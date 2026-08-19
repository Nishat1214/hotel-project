import express from "express";
import {
  initSslcommerzPayment,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
} from "../controllers/paymentGatewayController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/sslcommerz/init", protect, authorize("customer"), initSslcommerzPayment);

// These are called directly by SSLCommerz's servers via browser redirect — no auth possible
router.post("/sslcommerz/success", sslcommerzSuccess);
router.post("/sslcommerz/fail", sslcommerzFail);
router.post("/sslcommerz/cancel", sslcommerzCancel);

export default router;