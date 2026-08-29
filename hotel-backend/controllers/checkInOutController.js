import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import Payment from "../models/Payment.js";

// @desc   Receptionist/Admin checks in a guest
// @route  PUT /api/reservations/:id/checkin
// @access Private (Admin, Receptionist)
export const checkInGuest = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "Confirmed") {
      return res.status(400).json({
        message: `Check-in rejected: reservation status is "${reservation.status}", must be "Confirmed"`,
      });
    }

    if (reservation.checkedIn) {
      return res.status(400).json({ message: "Guest is already checked in" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedCheckIn = new Date(reservation.checkIn);
    plannedCheckIn.setHours(0, 0, 0, 0);

    if (today < plannedCheckIn) {
      return res.status(400).json({
        message: `Check-in rejected: today is before the reservation's check-in date (${plannedCheckIn.toDateString()})`,
      });
    }

    const room = await Room.findById(reservation.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status === "Occupied") {
      return res.status(400).json({ message: "Check-in rejected: room is already occupied" });
    }

    reservation.checkedIn = true;
    reservation.actualCheckIn = new Date();
    await reservation.save();

    room.status = "Occupied";
    await room.save();

    res.status(200).json({ message: "Guest checked in successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Preview the final bill before completing checkout (no changes made yet)
// @route  GET /api/reservations/:id/checkout-preview
// @access Private (Admin, Receptionist)
export const getCheckoutPreview = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("room", "roomNumber type");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const payment = await Payment.findOne({ reservation: reservation._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedCheckOut = new Date(reservation.checkOut);
    plannedCheckOut.setHours(0, 0, 0, 0);

    const daysLate = Math.max(0, Math.ceil((today - plannedCheckOut) / (1000 * 60 * 60 * 24)));

    const nights = Math.ceil(
      (new Date(reservation.checkOut) - new Date(reservation.checkIn)) / (1000 * 60 * 60 * 24)
    );
    const perNightRate = Math.round(payment.roomCharge / nights);
    const lateFee = daysLate * perNightRate;

    res.status(200).json({
      reservationId: reservation._id,
      paymentId: payment._id,
      room: reservation.room,
      roomCharge: payment.roomCharge,
      additionalCharges: payment.additionalCharges,
      totalAmount: payment.totalAmount,
      advanceAmount: payment.advanceAmount,
      advanceMethod: payment.advanceMethod,
      balanceAmount: payment.balanceAmount,
      balancePaid: payment.balancePaid,
      status: payment.status,
      daysLate,
      lateFee,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Receptionist/Admin checks out a guest — settles the remaining balance
// @route  PUT /api/reservations/:id/checkout
// @access Private (Admin, Receptionist)
export const checkOutGuest = async (req, res) => {
  try {
    const { additionalCharge, note, balanceMethod } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (!reservation.checkedIn) {
      return res.status(400).json({ message: "Guest has not been checked in yet" });
    }

    if (reservation.status === "Completed") {
      return res.status(400).json({ message: "Reservation is already checked out" });
    }

    const payment = await Payment.findOne({ reservation: reservation._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found for this reservation" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedCheckOut = new Date(reservation.checkOut);
    plannedCheckOut.setHours(0, 0, 0, 0);
    const daysLate = Math.max(0, Math.ceil((today - plannedCheckOut) / (1000 * 60 * 60 * 24)));

    if (daysLate > 0) {
      const nights = Math.ceil(
        (new Date(reservation.checkOut) - new Date(reservation.checkIn)) / (1000 * 60 * 60 * 24)
      );
      const perNightRate = Math.round(payment.roomCharge / nights);
      const lateFee = daysLate * perNightRate;

      payment.additionalCharges += lateFee;
      payment.additionalChargeNotes = payment.additionalChargeNotes
        ? `${payment.additionalChargeNotes}; Late checkout fee (${daysLate} extra night${daysLate > 1 ? "s" : ""}): Tk ${lateFee}`
        : `Late checkout fee (${daysLate} extra night${daysLate > 1 ? "s" : ""}): Tk ${lateFee}`;
      payment.totalAmount = payment.roomCharge + payment.additionalCharges;
      payment.balanceAmount = Math.max(0, payment.totalAmount - payment.advanceAmount);
      payment.balancePaid = false;
      await payment.save();
    }

    if (additionalCharge && Number(additionalCharge) > 0) {
      payment.additionalCharges += Number(additionalCharge);
      payment.additionalChargeNotes = payment.additionalChargeNotes
        ? `${payment.additionalChargeNotes}; ${note || "Checkout charge"}: ${additionalCharge}`
        : `${note || "Checkout charge"}: ${additionalCharge}`;
      payment.totalAmount = payment.roomCharge + payment.additionalCharges;
      payment.balanceAmount = Math.max(0, payment.totalAmount - payment.advanceAmount);
      payment.balancePaid = false;
      await payment.save();
    }

    if (payment.balanceAmount > 0 && !payment.balancePaid) {
      if (!balanceMethod) {
        return res.status(400).json({
          message: `Balance of Tk ${payment.balanceAmount} must be collected before checkout. Choose a payment method to confirm.`,
          balanceAmount: payment.balanceAmount,
          requiresBalanceMethod: true,
        });
      }
      if (!["cash", "card", "online"].includes(balanceMethod)) {
        return res.status(400).json({ message: "Invalid balance payment method" });
      }

      payment.balancePaid = true;
      payment.balanceMethod = balanceMethod;
      payment.balancePaidAt = new Date();
      payment.status = "Paid";
      await payment.save();

      reservation.paymentStatus = "Paid";
    }

    reservation.status = "Completed";
    reservation.actualCheckOut = new Date();
    await reservation.save();

    const room = await Room.findById(reservation.room);
    if (room) {
      room.status = "Available";
      await room.save();
    }

    res.status(200).json({
      message: "Guest checked out successfully",
      reservation,
      finalBill: payment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};