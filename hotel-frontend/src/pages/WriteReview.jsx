import { useState } from "react";
import api from "../services/api";

const WriteReview = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/reviews", { rating, comment });
      setSuccess(true);
      setComment("");
      setRating(5);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Write a Review</h1>

      {success && (
        <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4">
          Thank you! Your review has been posted.
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>}

        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-2xl"
            >
              {star <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-2">Your Experience</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={4}
          maxLength={500}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Tell us about your stay..."
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#1E3A8A] text-white px-6 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default WriteReview;