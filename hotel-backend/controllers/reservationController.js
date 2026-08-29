import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateInvoiceNumber } from "./paymentController.js";
import sendEmail from "../utils/sendEmail.js";
import { sendSetPasswordEmail } from "../utils/sendSetPasswordEmail.js";

const ADVANCE_PERCENTAGE = 0.2;

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
        <p>Your reservation is confirmed with your advance payment. Details:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Reservation ID:</strong></td><td>${reservation._id}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-in:</strong></td><td>${reservation.checkIn.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Check-out:</strong></td><td>${reservation.checkOut.toDateString()}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Total Amount:</strong></td><td>Tk ${reservation.totalPrice}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Advance Paid:</strong></td><td>Tk ${reservation.advanceAmount}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Balance Due at Checkout:</strong></td><td>Tk ${reservation.balanceAmount}</td></tr>
        </table>
        <p style="font-size:12px; color:#888;">Note: the advance payment is non-refundable if cancelled.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

const sendCancellationEmail = async (reservation) => {
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
          <tr><td style="padding:4px 0;"><strong>Advance Paid:</strong></td><td>Tk ${reservation.advanceAmount}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Refund:</strong></td><td>Non-refundable per our cancellation policy</td></tr>
        </table>
        <p>If you believe this was a mistake, please contact the front desk.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};

// Shared logic: run business rule checks and create the reservation + payment
export const createReservationRecord = async ({
  customerId,
  roomId,
  checkIn,
  checkOut,
  guests,
  advancePaymentMethod,
  bookingSource,
  transactionId,
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
  const advanceAmount = isPayAtHotel ? 0 : Math.round(totalPrice * ADVANCE_PERCENTAGE);
  const balanceAmount = Math.max(0, totalPrice - advanceAmount);
  const paymentStatus = advanceAmount > 0 ? "Advance Paid" : "Pending";

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
    balanceAmount,
    balancePaid: false,
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

// @desc   Customer books a room (self-service, always pays advance online)
// @route  POST /api/reservations
// @access Private (Customer)
export const bookRoom = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests } = req.body;

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
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// @desc   Receptionist creates a walk-in booking for a guest at the front desk
// @route  POST /api/reservations/walkin
// @access Private (Admin, Receptionist)
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
      advancePaymentMethod, // cash | card | pay_at_hotel
    } = req.body;

    if (!guestName || !guestEmail || !guestPhone || !roomId || !checkIn || !checkOut || !guests || !advancePaymentMethod) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (!["cash", "card", "pay_at_hotel"].includes(advancePaymentMethod)) {
      return res.status(400).json({ message: "Invalid advance payment method" });
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

// @desc   Get reservations (Admin/Receptionist see all, Customer sees only their own)
// @route  GET /api/reservations
// @access Private
export const getReservations = async (req, res) => {
  try {
    const filter = req.user.role === "customer" ? { customer: req.user._id } : {};
    const reservations = await Reservation.find(filter)
      .populate("customer", "name email")
      .populate("room", "roomNumber type price")
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Cancel a reservation — Admin/Receptionist ONLY, advance is never refunded
// @route  PUT /api/reservations/:id/cancel
// @access Private (Admin, Receptionist)
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status === "Completed") return res.status(400).json({ message: "Cannot cancel a completed reservation" });
    if (reservation.status === "Cancelled") return res.status(400).json({ message: "Reservation is already cancelled" });
    if (reservation.checkedIn) {
      return res.status(400).json({
        message: "Guest is already checked in. Use Check-out to end this stay instead of cancelling.",
      });
    }

    reservation.status = "Cancelled";
    await reservation.save();

    const room = await Room.findById(reservation.room);
    if (room && (room.status === "Reserved" || room.status === "Occupied")) {
      room.status = "Available";
      await room.save();
    }

    try {
      await sendCancellationEmail(reservation);
    } catch (emailErr) {
      console.error("❌ Failed to send cancellation email:", emailErr.message);
    }

    res.status(200).json({
      message: `Reservation cancelled. Advance payment of Tk ${reservation.advanceAmount} is non-refundable per policy.`,
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};