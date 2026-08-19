import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, required: true, unique: true },

    roomCharge: { type: Number, required: true },
    additionalCharges: { type: Number, default: 0 },
    additionalChargeNotes: { type: String, default: "" },
    totalAmount: { type: Number, required: true }, // roomCharge + additionalCharges

    advanceAmount: { type: Number, required: true },
    advanceMethod: { type: String, enum: ["online", "cash", "card"], required: true },
    advancePaidAt: { type: Date, default: Date.now },

    balanceAmount: { type: Number, required: true }, // totalAmount - advanceAmount
    balancePaid: { type: Boolean, default: false },
    balanceMethod: { type: String, enum: ["online", "cash", "card"] },
    balancePaidAt: { type: Date },

    status: {
      type: String,
      enum: ["Advance Paid", "Fully Paid"],
      default: "Advance Paid",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;