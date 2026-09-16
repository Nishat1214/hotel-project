import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const SubmitComplaint = () => {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");
  const [notCheckedIn, setNotCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotCheckedIn(false);
    setLoading(true);

    try {
      const { data } = await api.post("/complaints", { description: text });
      setSubmitted(data);
      setText("");
      window.dispatchEvent(new Event("complaints-updated"));
    } catch (err) {
      if (err.response?.status === 403) {
        setNotCheckedIn(true);
      } else {
        setError(err.response?.data?.message || "Failed to submit complaint");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Submit a Complaint</h1>

      {notCheckedIn ? (
        <div className="bg-yellow-50 text-yellow-800 rounded-lg p-6 text-sm">
          <p className="font-semibold mb-2">⚠️ You're not currently checked in</p>
          <p>
            Complaints can only be submitted while you're checked in at the hotel. If you have an
            upcoming or ongoing stay, please check in at the front desk first.
          </p>
          <Link
            to="/customer/reservations"
            className="inline-block mt-3 text-[#1E3A8A] font-semibold hover:underline"
          >
            View My Reservations →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>
          )}

          <label className="block text-sm font-medium mb-2">Describe your issue</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={4}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="e.g. The room smelled bad and the AC wasn't working."
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1E3A8A] text-white px-6 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      )}

      {submitted && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <p className="font-semibold text-green-600 mb-3">Complaint submitted successfully!</p>
          <p className="text-sm text-gray-500 mb-2">Our AI has categorized your complaint:</p>
          <p><strong>Category:</strong> {submitted.category}</p>
          <p><strong>Priority:</strong> {submitted.priority}</p>
          <p><strong>Routed to:</strong> {submitted.department}</p>
        </div>
      )}
    </div>
  );
};

export default SubmitComplaint;