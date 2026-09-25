import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";
import { sendRefundCompletedEmail } from "../utils/sendRefundEmail.js";

export const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("customer", "name email")
      .populate({
        path: "reservation",
        populate: { path: "room", select: "roomNumber type" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPaymentByReservation = async (req, res) => {
  try {
    const payment = await Payment.findOne({ reservation: req.params.reservationId })
      .populate("customer", "name email")
      .populate({
        path: "reservation",
        populate: { path: "room", select: "roomNumber type" },
      });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addAdditionalCharge = async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Charge amount must be greater than 0" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.additionalCharges += Number(amount);
    payment.additionalChargeNotes = payment.additionalChargeNotes
      ? `${payment.additionalChargeNotes}; ${note || "Additional charge"}: ${amount}`
      : `${note || "Additional charge"}: ${amount}`;
    payment.totalAmount = payment.roomCharge + payment.additionalCharges;

    payment.balanceAmount += Number(amount);
    payment.balancePaid = false;

    await payment.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const settleBalance = async (req, res) => {
  try {
    const { balanceMethod } = req.body;

    if (!["cash", "card"].includes(balanceMethod)) {
      return res.status(400).json({ message: "Invalid balance payment method" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.balancePaid || payment.balanceAmount <= 0) {
      return res.status(400).json({ message: "Balance is already settled" });
    }

    payment.balancePaid = true;
    payment.balanceMethod = balanceMethod;
    payment.balancePaidAt = new Date();
    payment.status = "Paid";
    payment.balanceAmount = 0; // reflect reality: nothing is actually owed anymore
    await payment.save();

    const reservation = await Reservation.findById(payment.reservation);
    if (reservation) {
      reservation.paymentStatus = "Paid";
      await reservation.save();
    }

    res.status(200).json({ message: "Balance settled successfully", payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Mark a pending refund as completed (Admin/Receptionist confirms they've paid it out)
// @route  PUT /api/payments/:id/mark-refunded
// @access Private (Admin, Receptionist)
export const markRefunded = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.refundStatus !== "Refund Due") {
      return res.status(400).json({ message: "No refund is currently pending for this payment" });
    }

    payment.refundStatus = "Refunded";
    await payment.save();

    try {
      await sendRefundCompletedEmail(payment, "manual");
    } catch (emailErr) {
      console.error("❌ Failed to send refund email:", emailErr.message);
    }

    res.status(200).json({ message: "Refund marked as completed", payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};