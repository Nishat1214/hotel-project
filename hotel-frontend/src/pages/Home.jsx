import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

const facilities = ["WiFi", "Pool", "Restaurant", "Gym", "Parking"];

const Home = () => {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get("/reviews");
        setReviews(data);
      } catch (err) {
        console.error("Failed to load reviews", err);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/rooms/categories");
        setFeaturedRooms(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured rooms", err);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      <Hero />
      <SearchBar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#1E3A8A] mb-8 text-center">Featured Rooms</h2>
        {featuredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRooms.map((cat) => (
              <Link
                key={cat.type}
                to={`/rooms/category/${cat.type}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition block"
              >
                <img
                  src={
                    cat.image ||
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={cat.type}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold text-[#1E3A8A] capitalize">{cat.type} Room</h3>
                  <p className="text-[#D4AF37] font-semibold">From Tk {cat.minPrice} / Night</p>
                  {cat.availableCount === 0 ? (
                    <p className="text-red-500 text-sm mt-1">Not Available</p>
                  ) : cat.availableCount === 3 || cat.availableCount === 4 ? (
                    <p className="text-orange-600 text-sm mt-1">⚠️ Only {cat.availableCount} left!</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No rooms available yet.</p>
        )}
      </section>

      <section className="bg-[#F8FAFC] py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#1E3A8A] mb-8">Hotel Facilities</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {facilities.map((facility) => (
              <div
                key={facility}
                className="bg-white shadow rounded-lg px-6 py-4 font-medium text-[#1E3A8A]"
              >
                {facility}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-[#1E3A8A] mb-8">Customer Reviews</h2>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {reviews.map((r) => (
              <div key={r._id} className="bg-white rounded-lg shadow p-5">
                <p className="text-yellow-500 mb-2">{"⭐".repeat(r.rating)}</p>
                <p className="text-gray-600 text-sm mb-3">"{r.comment}"</p>
                <p className="text-[#1E3A8A] font-semibold text-sm">— {r.customer?.name || "Guest"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No reviews yet — be the first to share your experience!</p>
        )}
      </section>
    </div>
  );
};

export default Home;