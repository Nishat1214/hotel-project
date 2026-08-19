import express from "express";
import {
  addRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomCategories,
} from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes — anyone (even guests) can browse/search rooms
// Public routes — anyone (even guests) can browse/search rooms
router.get("/", getAllRooms);
router.get("/categories", getRoomCategories); // must come before /:id
router.get("/:id", getRoomById);

// Admin-only routes
router.post("/", protect, authorize("admin"), addRoom);
router.put("/:id", protect, authorize("admin"), updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

export default router;