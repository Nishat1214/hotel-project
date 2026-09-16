import User from "../models/User.js";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import sendEmail from "./sendEmail.js";

export const sendRefundCompletedEmail = async (payment, method) => {
  const customer = await User.findById(payment.customer);
  const reservation = await Reservation.findById(payment.reservation);
  const room = reservation ? await Room.findById(reservation.room) : null;

  if (!customer) return;

  await sendEmail({
    to: customer.email,
    subject: "Refund Processed - GrandStay Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #16A34A;">Refund Completed ✅</h2>
        <p>Hi ${customer.name},</p>
        <p>Your refund for the cancelled/missed reservation has been processed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;"><strong>Invoice:</strong></td><td>${payment.invoiceNumber}</td></tr>
          ${room ? `<tr><td style="padding:4px 0;"><strong>Room:</strong></td><td>${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room ${room.roomNumber}</td></tr>` : ""}
          <tr><td style="padding:4px 0;"><strong>Refund Amount:</strong></td><td>Tk ${reservation?.refundAmount ?? 0}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Method:</strong></td><td>${method === "sslcommerz" ? "SSLCommerz (Online)" : "Manual (Cash/Card)"}</td></tr>
        </table>
        <p>${
          method === "sslcommerz"
            ? "The amount should reflect on your original payment method within a few business days."
            : "Please collect your refund at the front desk if you haven't already."
        }</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};