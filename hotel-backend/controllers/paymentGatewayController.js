import SSLCommerzPayment from "sslcommerz-lts";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import PendingBooking from "../models/PendingBooking.js";
import PendingBalancePayment from "../models/PendingBalancePayment.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";
import { createReservationRecord } from "./reservationController.js";
import { sendSetPasswordEmail } from "../utils/sendSetPasswordEmail.js";

const ADVANCE_PERCENTAGE = 0.2;

const buildSslData = ({ tranId, amount, productLabel, customer }) => ({
  total_amount: amount,
  currency: "BDT",
  tran_id: tranId,
  success_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/success`,
  fail_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/fail`,
  cancel_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/cancel`,
  shipping_method: "NA",
  product_name: productLabel,
  product_category: "Hotel Booking",
  product_profile: "general",
  cus_name: customer.name,
  cus_email: customer.email,
  cus_add1: "Dhaka",
  cus_city: "Dhaka",
  cus_postcode: "1000",
  cus_country: "Bangladesh",
  cus_phone: customer.phone,
  ship_name: customer.name,
  ship_add1: "Dhaka",
  ship_city: "Dhaka",
  ship_postcode: "1000",
  ship_country: "Bangladesh",
});

// @desc   Customer initiates advance payment for a booking via SSLCommerz sandbox
// @route  POST /api/payments/sslcommerz/init
// @access Private (Customer)
export const initSslcommerzPayment = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false;

    const { roomId, checkIn, checkOut, guests } = req.body;

    if (!roomId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    const totalPrice = nights * room.price;
    const advanceAmount = Math.round(totalPrice * ADVANCE_PERCENTAGE);
    const tranId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    await PendingBooking.create({
      tranId,
      customer: req.user._id,
      room: roomId,
      checkIn,
      checkOut,
      guests,
      advanceAmount,
      bookingSource: "customer",
    });

    const customer = await User.findById(req.user._id);
    const sslData = buildSslData({
      tranId,
      amount: advanceAmount,
      productLabel: `${room.type} Room Advance Payment`,
      customer,
    });

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(sslData);

    if (!apiResponse?.GatewayPageURL) {
      await PendingBooking.findOneAndDelete({ tranId });
      return res.status(500).json({ message: "Failed to initiate payment gateway", details: apiResponse });
    }

    res.status(200).json({ gatewayUrl: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error("SSLCommerz init exception:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Receptionist initiates a walk-in guest's advance payment via SSLCommerz sandbox
// @route  POST /api/payments/sslcommerz/init-walkin
// @access Private (Admin, Receptionist)
export const initWalkInSslcommerzPayment = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false;

    const { guestName, guestEmail, guestPhone, roomId, checkIn, checkOut, guests } = req.body;

    if (!guestName || !guestEmail || !guestPhone || !roomId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    const totalPrice = nights * room.price;
    const advanceAmount = Math.round(totalPrice * ADVANCE_PERCENTAGE);
    const tranId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

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

    await PendingBooking.create({
      tranId,
      customer: customer._id,
      room: roomId,
      checkIn,
      checkOut,
      guests,
      advanceAmount,
      bookingSource: "receptionist",
      isNewCustomer,
    });

    const sslData = buildSslData({
      tranId,
      amount: advanceAmount,
      productLabel: `${room.type} Room Advance Payment (Walk-in)`,
      customer,
    });

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(sslData);

    if (!apiResponse?.GatewayPageURL) {
      await PendingBooking.findOneAndDelete({ tranId });
      return res.status(500).json({ message: "Failed to initiate payment gateway", details: apiResponse });
    }

    res.status(200).json({ gatewayUrl: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error("SSLCommerz walk-in init exception:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Admin/Receptionist initiates settling a reservation's remaining balance via SSLCommerz
// @route  POST /api/payments/sslcommerz/init-balance
// @access Private (Admin, Receptionist)
export const initBalanceSslcommerzPayment = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false;

    const { paymentId, completeCheckout } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    const payment = await Payment.findById(paymentId).populate("customer", "name email phone");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.balancePaid || payment.balanceAmount <= 0) {
      return res.status(400).json({ message: "Balance is already settled" });
    }

    const tranId = `BAL-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    await PendingBalancePayment.create({
      tranId,
      payment: payment._id,
      reservation: payment.reservation,
      amount: payment.balanceAmount,
      completeCheckout: !!completeCheckout,
    });

    const sslData = buildSslData({
      tranId,
      amount: payment.balanceAmount,
      productLabel: `Balance Settlement - Invoice ${payment.invoiceNumber}`,
      customer: payment.customer,
    });

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(sslData);

    if (!apiResponse?.GatewayPageURL) {
      await PendingBalancePayment.findOneAndDelete({ tranId });
      return res.status(500).json({ message: "Failed to initiate payment gateway", details: apiResponse });
    }

    res.status(200).json({ gatewayUrl: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error("SSLCommerz balance init exception:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   SSLCommerz redirects here after a SUCCESSFUL payment (advance OR balance)
// @route  POST /api/payments/sslcommerz/success
export const sslcommerzSuccess = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false;

    const { tran_id, val_id } = req.body;

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
    }

    // Case 1: this transaction is an ADVANCE payment (new booking)
    const pendingBooking = await PendingBooking.findOne({ tranId: tran_id });
    if (pendingBooking && pendingBooking.status !== "Completed") {
      try {
        const reservation = await createReservationRecord({
          customerId: pendingBooking.customer,
          roomId: pendingBooking.room,
          checkIn: pendingBooking.checkIn,
          checkOut: pendingBooking.checkOut,
          guests: pendingBooking.guests,
          advancePaymentMethod: "online",
          bookingSource: pendingBooking.bookingSource,
          transactionId: val_id,
        });

        pendingBooking.status = "Completed";
        await pendingBooking.save();

        if (pendingBooking.isNewCustomer) {
          try {
            const customerUser = await User.findById(pendingBooking.customer);
            await sendSetPasswordEmail(customerUser);
          } catch (emailErr) {
            console.error("❌ Failed to send set-password email:", emailErr.message);
          }
        }

        return res.redirect(`${process.env.FRONTEND_URL}/booking/success?id=${reservation._id}`);
      } catch (bookingError) {
        pendingBooking.status = "Failed";
        await pendingBooking.save();
        return res.redirect(
          `${process.env.FRONTEND_URL}/booking/fail?reason=${encodeURIComponent(bookingError.message || "Booking failed")}`
        );
      }
    }

    // Case 2: this transaction is a BALANCE settlement (Billing or Checkout)
    const pendingBalance = await PendingBalancePayment.findOne({ tranId: tran_id });
    if (pendingBalance && pendingBalance.status !== "Completed") {
      const payment = await Payment.findById(pendingBalance.payment);
      const reservation = await Reservation.findById(pendingBalance.reservation);

      if (!payment || !reservation) {
        return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
      }

      payment.balancePaid = true;
      payment.balanceMethod = "online";
      payment.balancePaidAt = new Date();
      payment.balanceTransactionId = val_id;
      payment.status = "Paid";
      await payment.save();

      reservation.paymentStatus = "Paid";

      if (pendingBalance.completeCheckout) {
        reservation.status = "Completed";
        reservation.actualCheckOut = new Date();
        const room = await Room.findById(reservation.room);
        if (room) {
          room.status = "Available";
          await room.save();
        }
      }
      await reservation.save();

      pendingBalance.status = "Completed";
      await pendingBalance.save();

      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/balance-success?id=${reservation._id}&checkout=${pendingBalance.completeCheckout}`
      );
    }

    return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
  } catch (error) {
    console.error("SSLCommerz success handler error:", error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
  }
};

// @desc   SSLCommerz redirects here after a FAILED payment
export const sslcommerzFail = async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    await PendingBooking.findOneAndUpdate({ tranId: tran_id }, { status: "Failed" });
    await PendingBalancePayment.findOneAndUpdate({ tranId: tran_id }, { status: "Failed" });
  }
  return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
};

// @desc   SSLCommerz redirects here if the customer CANCELS the payment
export const sslcommerzCancel = async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    await PendingBooking.findOneAndDelete({ tranId: tran_id });
    await PendingBalancePayment.findOneAndDelete({ tranId: tran_id });
  }
  return res.redirect(`${process.env.FRONTEND_URL}/booking/cancel`);
};