import Review from "../models/Review.js";

// @desc   Customer submits a review
// @route  POST /api/reviews
// @access Private (Customer)
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      customer: req.user._id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get latest reviews (public, for homepage)
// @route  GET /api/reviews
// @access Public
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};