import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";

// Helper: generate a simple unique invoice number
export const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
};

// @desc   Get all payments (Admin/Receptionist)
// @route  GET /api/payments
// @access Private (Admin, Receptionist)
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

// @desc   Get a single payment by reservation ID
// @route  GET /api/payments/reservation/:reservationId
// @access Private
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

// @desc   Add an additional service charge to a payment (e.g. minibar, damage)
// @route  PUT /api/payments/:id/add-charge
// @access Private (Admin, Receptionist)
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
    payment.balanceAmount = Math.max(0, payment.totalAmount - payment.advanceAmount);
    payment.balancePaid = false;

    await payment.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Settle the outstanding balance for a payment (e.g. from Billing page directly)
// @route  PUT /api/payments/:id/settle-balance
// @access Private (Admin, Receptionist)
export const settleBalance = async (req, res) => {
  try {
    const { balanceMethod } = req.body;

    if (!["cash", "card", "online"].includes(balanceMethod)) {
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