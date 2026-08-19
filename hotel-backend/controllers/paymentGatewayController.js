import SSLCommerzPayment from "sslcommerz-lts";
import crypto from "crypto";
import PendingBooking from "../models/PendingBooking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { createReservationRecord } from "./reservationController.js";

const ADVANCE_PERCENTAGE = 0.2;

// @desc   Customer initiates advance payment for a booking via SSLCommerz sandbox
// @route  POST /api/payments/sslcommerz/init
// @access Private (Customer)
export const initSslcommerzPayment = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false; // sandbox mode

    const { roomId, checkIn, checkOut, guests } = req.body;

    if (!roomId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
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
    });

    const customer = await User.findById(req.user._id);

    const sslData = {
      total_amount: advanceAmount,
      currency: "BDT",
      tran_id: tranId,
      success_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/success`,
      fail_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/fail`,
      cancel_url: `${process.env.BACKEND_URL}/api/payments/sslcommerz/cancel`,
      shipping_method: "NA",
      product_name: `${room.type} Room Advance Payment`,
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
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(sslData);

    console.log("🔍 SSLCommerz init response:", apiResponse);

    if (!apiResponse?.GatewayPageURL) {
      await PendingBooking.findOneAndDelete({ tranId });
      return res.status(500).json({
        message: "Failed to initiate payment gateway",
        details: apiResponse,
      });
    }

    res.status(200).json({ gatewayUrl: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error("🔍 SSLCommerz init exception:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   SSLCommerz redirects here after a SUCCESSFUL payment
// @route  POST /api/payments/sslcommerz/success
// @access Public (called by SSLCommerz)
export const sslcommerzSuccess = async (req, res) => {
  try {
    const store_id = process.env.SSLCZ_STORE_ID;
    const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
    const is_live = false; // sandbox mode

    const { tran_id, val_id } = req.body;

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
    }

    const pending = await PendingBooking.findOne({ tranId: tran_id });
    if (!pending || pending.status === "Completed") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
    }

    try {
      const reservation = await createReservationRecord({
        customerId: pending.customer,
        roomId: pending.room,
        checkIn: pending.checkIn,
        checkOut: pending.checkOut,
        guests: pending.guests,
        advancePaymentMethod: "online",
        bookingSource: "customer",
      });

      pending.status = "Completed";
      await pending.save();

      return res.redirect(`${process.env.FRONTEND_URL}/booking/success?id=${reservation._id}`);
    } catch (bookingError) {
      pending.status = "Failed";
      await pending.save();
      return res.redirect(
        `${process.env.FRONTEND_URL}/booking/fail?reason=${encodeURIComponent(bookingError.message || "Booking failed")}`
      );
    }
  } catch (error) {
    console.error("SSLCommerz success handler error:", error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
  }
};

// @desc   SSLCommerz redirects here after a FAILED payment
// @route  POST /api/payments/sslcommerz/fail
export const sslcommerzFail = async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    await PendingBooking.findOneAndUpdate({ tranId: tran_id }, { status: "Failed" });
  }
  return res.redirect(`${process.env.FRONTEND_URL}/booking/fail`);
};

// @desc   SSLCommerz redirects here if the customer CANCELS the payment
// @route  POST /api/payments/sslcommerz/cancel
export const sslcommerzCancel = async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    await PendingBooking.findOneAndDelete({ tranId: tran_id });
  }
  return res.redirect(`${process.env.FRONTEND_URL}/booking/cancel`);
};