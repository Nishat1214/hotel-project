import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },

    // Who created this booking
    bookingSource: {
      type: String,
      enum: ["customer", "receptionist"], // customer = self-booked online, receptionist = walk-in
      default: "customer",
    },

    // Advance / initial payment (confirms the booking)
    advanceAmount: { type: Number, required: true },
    advancePaymentMethod: {
      type: String,
      enum: ["online", "cash", "card", "pay_at_hotel"],
      required: true,
    },
    transactionId: { type: String },

    // Remaining balance (settled at checkout)
    balanceAmount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Advance Paid", "Paid"],
      default: "Advance Paid",
    },

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Completed", "No-Show"],
      default: "Confirmed", // advance payment confirms the booking immediately
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    checkedIn: { type: Boolean, default: false },
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },
  },
  { timestamps: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;