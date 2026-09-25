import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateInvoiceNumber } from "./paymentController.js";
import sendEmail from "../utils/sendEmail.js";
import { sendSetPasswordEmail } from "../utils/sendSetPasswordEmail.js";

const ADVANCE_PERCENTAGE = 0.2;//20% advance payment for online booking,rest to be paid at hotel

const hasOverlap = async (roomId, checkIn, checkOut, excludeReservationId = null) => {
  const query = {
    room: roomId,
    status: { $ne: "Cancelled" },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeReservationId) query._id = { $ne: excludeReservationId };
  const overlap = await Reservation.findOne(query);
  return !!overlap;
};

const calculateRefund = (reservation, payment) => {
  const amountPaid = payment
    ? payment.advanceAmount + (payment.balancePaid ? payment.totalAmount - payment.advanceAmount : 0)
    : reservation.advanceAmount;

  const advanceComponent = Math.round(reservation.totalPrice * ADVANCE_PERCENTAGE);
  const nonRefundableAmount = Math.min(advanceComponent, amountPaid);
  const refundAmount = Math.max(0, amountPaid - nonRefundableAmount);

  return { nonRefundableAmount, refundAmount };
};

const sendConfirmationEmail = async (reservation) => {
  const room = await Room.findById(reservation.room);
  const customer = await User.findById(reservation.customer);

  await sendEmail({
    to: customer.email,
    subject: "Reservation Confirmed - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1E3A8A;">Reservation Confirmed ✅</h2>
        <p>Hi ${customer.name},</p>
        <p>Your reservation is confirmed. Details:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Reservation ID:</strong></td><td>${reservation._id}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-in:</strong></td><td>${reservation.checkIn.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-out:</strong></td><td>${reservation.checkOut.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Total Amount:</strong></td><td>Tk ${reservation.totalPrice}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Paid Now:</strong></td><td>Tk ${reservation.advanceAmount}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Balance Due at Checkout:</strong></td><td>Tk ${reservation.balanceAmount}</td></tr>
        </table>
        <p style="font-size:12px; color:#888;">Note: any amount paid is non-refundable if cancelled.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const sendCancellationEmail = async (reservation, nonRefundableAmount, refundAmount) => {
  const room = await Room.findById(reservation.room);
  const customer = await User.findById(reservation.customer);

  await sendEmail({
    to: customer.email,
    subject: "Reservation Cancelled - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #DC2626;">Reservation Cancelled</h2>
        <p>Hi ${customer.name},</p>
        <p>Your reservation has been cancelled. Details:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Reservation ID:</strong></td><td>${reservation._id}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-in:</strong></td><td>${reservation.checkIn.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Non-refundable Amount:</strong></td><td>Tk ${nonRefundableAmount}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Refund Amount:</strong></td><td>Tk ${refundAmount}</td></tr>
        </table>
        ${
          refundAmount > 0
            ? `<p>Your refund of Tk ${refundAmount} will be processed by our team shortly.</p>`
            : `<p>The advance payment is non-refundable per our cancellation policy.</p>`
        }
        <p>If you believe this was a mistake, please contact the front desk.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const sendNoShowEmail = async (reservation, nonRefundableAmount, refundAmount) => {
  const room = await Room.findById(reservation.room);
  const customer = await User.findById(reservation.customer);

  await sendEmail({
    to: customer.email,
    subject: "Missed Reservation - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #EA580C;">Reservation Marked as No-Show</h2>
        <p>Hi ${customer.name},</p>
        <p>We noticed you didn't check in for your reservation:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Reservation ID:</strong></td><td>${reservation._id}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-in Date:</strong></td><td>${reservation.checkIn.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Non-refundable Amount:</strong></td><td>Tk ${nonRefundableAmount}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Refund Amount:</strong></td><td>Tk ${refundAmount}</td></tr>
        </table>
        ${
          refundAmount > 0
            ? `<p>Your refund of Tk ${refundAmount} will be processed by our team shortly.</p>`
            : `<p>The advance payment is non-refundable per our policy.</p>`
        }
        <p>If this was a mistake, please contact the front desk.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const sendDateChangeEmail = async (reservation) => {
  const room = await Room.findById(reservation.room);
  const customer = await User.findById(reservation.customer);

  await sendEmail({
    to: customer.email,
    subject: "Reservation Dates Updated - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1E3A8A;">Reservation Dates Updated</h2>
        <p>Hi ${customer.name},</p>
        <p>Your reservation dates have been updated by our staff:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>New Check-in:</strong></td><td>${reservation.checkIn.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>New Check-out:</strong></td><td>${reservation.checkOut.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Updated Total:</strong></td><td>Tk ${reservation.totalPrice}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Balance Due:</strong></td><td>Tk ${reservation.balanceAmount}</td></tr>
        </table>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const sendRoomChangeEmailToCustomer = async (reservation, newRoom) => {
  const customer = await User.findById(reservation.customer);

  await sendEmail({
    to: customer.email,
    subject: "Room Changed - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1E3A8A;">Your Room Has Been Changed</h2>
        <p>Hi ${customer.name},</p>
        <p>Your reservation has been moved to a new room:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>New Room:</strong></td><td>${newRoom.type.charAt(0).toUpperCase() + newRoom.type.slice(1)} Room ${newRoom.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Updated Total:</strong></td><td>Tk ${reservation.totalPrice}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Balance Due:</strong></td><td>Tk ${reservation.balanceAmount}</td></tr>
        </table>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const markNoShows = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueReservations = await Reservation.find({
    status: "Confirmed",
    checkedIn: false,
    checkIn: { $lt: today },
  });

  for (const reservation of overdueReservations) {
    try {
      const payment = await Payment.findOne({ reservation: reservation._id });
      const { nonRefundableAmount, refundAmount } = calculateRefund(reservation, payment);

      reservation.status = "No-Show";
      reservation.refundAmount = refundAmount;
      await reservation.save();

      if (payment && refundAmount > 0) {
        payment.refundStatus = "Refund Due";
        await payment.save();
      }

      const room = await Room.findById(reservation.room);
      if (room && room.status === "Reserved") {
        room.status = "Available";
        await room.save();
      }

      try {
        await sendNoShowEmail(reservation, nonRefundableAmount, refundAmount);
      } catch (emailErr) {
        console.error("❌ Failed to send no-show email:", emailErr.message);
      }
    } catch (noShowErr) {
      console.error(`❌ Failed to process no-show for reservation ${reservation._id}:`, noShowErr.message);
    }
  }
};

export const createReservationRecord = async ({
  customerId,
  roomId,
  checkIn,
  checkOut,
  guests,
  advancePaymentMethod,
  bookingSource,
  transactionId,
  paymentOption,
  bankTransactionId,
}) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) throw { status: 400, message: "Check-in date cannot be in the past" };
  if (checkOutDate <= checkInDate) throw { status: 400, message: "Check-out date must be after check-in date" };

  const room = await Room.findById(roomId);
  if (!room) throw { status: 404, message: "Room not found" };
  if (room.status === "Maintenance") throw { status: 400, message: "This room is under maintenance and cannot be booked" };
  if (guests > room.capacity) throw { status: 400, message: `This room only accommodates up to ${room.capacity} guests` };

  const sameCustomerOverlap = await Reservation.findOne({
    customer: customerId,
    status: { $ne: "Cancelled" },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  }).populate("room");

  if (sameCustomerOverlap && sameCustomerOverlap.room?.type === room.type) {
    throw {
      status: 400,
      message: `This customer already has a ${room.type} room booked for overlapping dates (Booking ID: ${sameCustomerOverlap._id.toString().slice(-6).toUpperCase()}).`,
    };
  }

  if (await hasOverlap(roomId, checkInDate, checkOutDate)) {
    throw { status: 400, message: "This room was just booked. Please choose a different room or dates." };
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * room.price;

  const isPayAtHotel = advancePaymentMethod === "pay_at_hotel";
  const isFullPayment = paymentOption === "full";

  let advanceAmount;
  if (isPayAtHotel) {
    advanceAmount = 0;
  } else if (isFullPayment) {
    advanceAmount = totalPrice;
  } else {
    advanceAmount = Math.round(totalPrice * ADVANCE_PERCENTAGE);
  }

  const balanceAmount = Math.max(0, totalPrice - advanceAmount);
  const paymentStatus = balanceAmount === 0 && advanceAmount > 0 ? "Paid" : advanceAmount > 0 ? "Advance Paid" : "Pending";

  const reservation = await Reservation.create({
    customer: customerId,
    room: roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    totalPrice,
    bookingSource,
    advanceAmount,
    advancePaymentMethod,
    transactionId,
    balanceAmount,
    paymentStatus,
    status: "Confirmed",
  });

  const conflict = await Reservation.findOne({
    room: roomId,
    _id: { $ne: reservation._id },
    status: { $ne: "Cancelled" },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
    createdAt: { $lt: reservation.createdAt },
  });

  if (conflict) {
    await Reservation.findByIdAndDelete(reservation._id);
    throw { status: 400, message: "This room was just booked by another guest a moment earlier." };
  }

  await Payment.create({
    reservation: reservation._id,
    customer: customerId,
    invoiceNumber: generateInvoiceNumber(),
    roomCharge: totalPrice,
    additionalCharges: 0,
    totalAmount: totalPrice,
    advanceAmount,
    advanceMethod: advancePaymentMethod,
    advancePaidAt: advanceAmount > 0 ? new Date() : undefined,
    transactionId,
    advanceBankTranId: bankTransactionId,
    balanceAmount,
    balancePaid: balanceAmount === 0 && advanceAmount > 0,
    balanceMethod: balanceAmount === 0 && advanceAmount > 0 ? advancePaymentMethod : undefined,
    balancePaidAt: balanceAmount === 0 && advanceAmount > 0 ? new Date() : undefined,
    status: paymentStatus,
  });

  if (room.status === "Available") {
    room.status = "Reserved";
    await room.save();
  }

  try {
    await sendConfirmationEmail(reservation);
  } catch (emailErr) {
    console.error("❌ Failed to send confirmation email:", emailErr.message);
  }

  return reservation;
};

export const bookRoom = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, paymentOption } = req.body;

    if (!roomId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const reservation = await createReservationRecord({
      customerId: req.user._id,
      roomId,
      checkIn,
      checkOut,
      guests,
      advancePaymentMethod: "online",
      bookingSource: "customer",
      paymentOption,
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

export const createWalkInBooking = async (req, res) => {
  try {
    const {
      guestName,
      guestEmail,
      guestPhone,
      roomId,
      checkIn,
      checkOut,
      guests,
      advancePaymentMethod,
      paymentOption,
    } = req.body;

    if (!guestName || !guestEmail || !guestPhone || !roomId || !checkIn || !checkOut || !guests || !advancePaymentMethod) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (!["cash", "card"].includes(advancePaymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let customer = await User.findOne({ email: guestEmail });
    let isNewCustomer = false;

    if (!customer) {
      const tempPassword = crypto.randomBytes(6).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      customer = await User.create({
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        password: hashedPassword,
        role: "customer",
      });
      isNewCustomer = true;
    }

    const reservation = await createReservationRecord({
      customerId: customer._id,
      roomId,
      checkIn,
      checkOut,
      guests,
      advancePaymentMethod,
      bookingSource: "receptionist",
      paymentOption,
    });

    if (isNewCustomer) {
      try {
        await sendSetPasswordEmail(customer);
      } catch (emailErr) {
        console.error("❌ Failed to send set-password email:", emailErr.message);
      }
    }

    res.status(201).json(reservation);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

export const getReservations = async (req, res) => {
  try {
    await markNoShows();

    const filter = req.user.role === "customer" ? { customer: req.user._id } : {};
    const reservations = await Reservation.find(filter)
      .populate("customer", "name email")
      .populate("room", "roomNumber type price")
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    console.error("🔍 getReservations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status === "Completed") return res.status(400).json({ message: "Cannot cancel a completed reservation" });
    if (reservation.status === "Cancelled") return res.status(400).json({ message: "Reservation is already cancelled" });
    if (reservation.status === "No-Show") return res.status(400).json({ message: "This reservation is already marked as a no-show" });
    if (reservation.checkedIn) {
      return res.status(400).json({
        message: "Guest is already checked in. Use Check-out to end this stay instead of cancelling.",
      });
    }

    const payment = await Payment.findOne({ reservation: reservation._id });
    const { nonRefundableAmount, refundAmount } = calculateRefund(reservation, payment);

    reservation.status = "Cancelled";
    reservation.refundAmount = refundAmount;
    await reservation.save();

    if (payment && refundAmount > 0) {
      payment.refundStatus = "Refund Due";
      await payment.save();
    }

    const room = await Room.findById(reservation.room);
    if (room && (room.status === "Reserved" || room.status === "Occupied")) {
      room.status = "Available";
      await room.save();
    }

    try {
      await sendCancellationEmail(reservation, nonRefundableAmount, refundAmount);
    } catch (emailErr) {
      console.error("❌ Failed to send cancellation email:", emailErr.message);
    }

    res.status(200).json({
      message:
        refundAmount > 0
          ? `Reservation cancelled. Tk ${nonRefundableAmount} (advance) is non-refundable; Tk ${refundAmount} will be refunded to the guest.`
          : `Reservation cancelled. Amount paid (Tk ${nonRefundableAmount}) is non-refundable per policy.`,
      refundAmount,
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Admin/Receptionist modifies a reservation's check-in/check-out dates
// @route  PUT /api/reservations/:id/modify-dates
// @access Private (Admin, Receptionist)
export const modifyReservationDates = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: "Please provide new check-in and check-out dates" });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.status !== "Confirmed") {
      return res.status(400).json({
        message: `Cannot modify dates: reservation status is "${reservation.status}"`,
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }
    if (!reservation.checkedIn && checkInDate < today) {
      return res.status(400).json({ message: "Check-in date cannot be in the past" });
    }

    const room = await Room.findById(reservation.room);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const overlap = await hasOverlap(reservation.room, checkInDate, checkOutDate, reservation._id);
    if (overlap) {
      return res.status(400).json({ message: "This room is already booked by another guest for the new dates" });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const newRoomCharge = nights * room.price;

    const payment = await Payment.findOne({ reservation: reservation._id });
    if (payment) {
      const newTotalAmount = newRoomCharge + payment.additionalCharges;
      const newBalanceAmount = Math.max(0, newTotalAmount - payment.advanceAmount);

      payment.roomCharge = newRoomCharge;
      payment.totalAmount = newTotalAmount;
      payment.balanceAmount = newBalanceAmount;

      if (newBalanceAmount > 0) {
        payment.balancePaid = false;
        payment.status = payment.advanceAmount > 0 ? "Advance Paid" : "Pending";
      } else {
        payment.balancePaid = true;
        payment.status = "Paid";
      }
      await payment.save();

      reservation.paymentStatus = payment.status;
      reservation.balanceAmount = newBalanceAmount;
    }

    reservation.checkIn = checkInDate;
    reservation.checkOut = checkOutDate;
    reservation.totalPrice = newRoomCharge + (payment ? payment.additionalCharges : 0);
    await reservation.save();

    try {
      await sendDateChangeEmail(reservation);
    } catch (emailErr) {
      console.error("❌ Failed to send date-change email:", emailErr.message);
    }

    res.status(200).json({ message: "Reservation dates updated successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Admin/Receptionist moves a guest to a different room directly (not tied to a complaint)
// @route  PUT /api/reservations/:id/change-room
// @access Private (Admin, Receptionist)
export const changeReservationRoom = async (req, res) => {
  try {
    const { newRoomId } = req.body;
    if (!newRoomId) {
      return res.status(400).json({ message: "newRoomId is required" });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (["Cancelled", "Completed", "No-Show"].includes(reservation.status)) {
      return res.status(400).json({
        message: `Cannot change room: reservation status is "${reservation.status}"`,
      });
    }

    const oldRoom = await Room.findById(reservation.room);
    const newRoom = await Room.findById(newRoomId);
    if (!newRoom) return res.status(404).json({ message: "New room not found" });

    if (newRoom._id.toString() === reservation.room.toString()) {
      return res.status(400).json({ message: "This is already the guest's current room" });
    }
    if (newRoom.status === "Maintenance") {
      return res.status(400).json({ message: "Selected room is under maintenance" });
    }
    if (reservation.guests > newRoom.capacity) {
      return res.status(400).json({
        message: `Selected room only accommodates up to ${newRoom.capacity} guests`,
      });
    }

    const overlap = await hasOverlap(newRoomId, reservation.checkIn, reservation.checkOut, reservation._id);
    if (overlap) {
      return res.status(400).json({ message: "Selected room is not available for these dates" });
    }

    const nights = Math.ceil((reservation.checkOut - reservation.checkIn) / (1000 * 60 * 60 * 24));
    const newRoomCharge = nights * newRoom.price;

    const payment = await Payment.findOne({ reservation: reservation._id });
    if (payment) {
      const newTotalAmount = newRoomCharge + payment.additionalCharges;
      const newBalanceAmount = Math.max(0, newTotalAmount - payment.advanceAmount);

      payment.roomCharge = newRoomCharge;
      payment.totalAmount = newTotalAmount;
      payment.balanceAmount = newBalanceAmount;
      payment.balancePaid = newBalanceAmount === 0;
      payment.status =
        newBalanceAmount === 0 ? "Paid" : payment.advanceAmount > 0 ? "Advance Paid" : "Pending";
      await payment.save();

      reservation.paymentStatus = payment.status;
      reservation.balanceAmount = newBalanceAmount;
    }

    reservation.room = newRoomId;
    reservation.totalPrice = newRoomCharge + (payment ? payment.additionalCharges : 0);
    await reservation.save();

    if (oldRoom) {
      oldRoom.status = "Available";
      await oldRoom.save();
    }
    newRoom.status = reservation.checkedIn ? "Occupied" : "Reserved";
    await newRoom.save();

    try {
      await sendRoomChangeEmailToCustomer(reservation, newRoom);
    } catch (emailErr) {
      console.error("❌ Failed to send room-change email:", emailErr.message);
    }

    res.status(200).json({
      message: `Guest moved to ${newRoom.type} Room ${newRoom.roomNumber}`,
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};