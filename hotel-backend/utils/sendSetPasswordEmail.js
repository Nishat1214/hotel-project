import crypto from "crypto";
import sendEmail from "./sendEmail.js";

// Sends a "set your password" email to a newly created walk-in guest account,
// reusing the same reset-token mechanism as Forgot Password.
export const sendSetPasswordEmail = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours for a new account
  await user.save();

  const setPasswordLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Welcome to GrandStay Hotel - Set Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1E3A8A;">Welcome, ${user.name}!</h2>
        <p>An account has been created for you at GrandStay Hotel so you can view and manage your reservation online.</p>
        <p>Click the button below to set your password (valid for 24 hours):</p>
        <a href="${setPasswordLink}" style="display:inline-block; background:#1E3A8A; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; margin:16px 0;">
          Set My Password
        </a>
        <p>Once set, you can log in anytime with your email and new password to view your reservation.</p>
        <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
      </div>
    `,
  });
};