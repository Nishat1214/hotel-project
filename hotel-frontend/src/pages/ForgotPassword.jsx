import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setDevLink("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      if (data.devResetLink) setDevLink(data.devResetLink); // TEMP, dev-only
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-2 text-center text-[#1E3A8A]">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded mt-4">{message}</p>
        )}

        {/* TEMPORARY dev helper — remove once real email sending is set up */}
        {devLink && (
          <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded mt-2">
            <p className="font-semibold mb-1">🛠️ Dev mode (no email service yet):</p>
            <Link to={devLink.replace("http://localhost:5173", "")} className="underline break-all">
              {devLink}
            </Link>
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-[#1E3A8A] font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;