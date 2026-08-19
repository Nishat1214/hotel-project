import mongoose from "mongoose";

const pendingBookingSchema = new mongoose.Schema(
  {
    tranId: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Initiated", "Completed", "Failed"],
      default: "Initiated",
    },
  },
  { timestamps: true }
);

// Auto-delete stale pending bookings after 1 hour (in case customer abandons payment)
pendingBookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const PendingBooking = mongoose.model("PendingBooking", pendingBookingSchema);

export default PendingBooking;