import express from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", protect, authorize("customer"), createReview);

export default router;