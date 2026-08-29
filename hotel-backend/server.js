import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { protect } from "./middleware/authMiddleware.js";
import { authorize } from "./middleware/roleMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import paymentGatewayRoutes from "./routes/paymentGatewayRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.send("Hotel Backend API is running ✅");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments", paymentGatewayRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRoutes);
// Temporary test route — only logged-in admins can access this
app.get("/api/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.name}, you have access!` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});