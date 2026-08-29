import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

const Rooms = () => {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const typeFilter = searchParams.get("type");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const params = {};
        if (checkIn && checkOut) {
          params.checkIn = checkIn;
          params.checkOut = checkOut;
        }
        const { data } = await api.get("/rooms/categories", { params });
        const filtered = typeFilter ? data.filter((c) => c.type === typeFilter) : data;
        setCategories(filtered);
      } catch (err) {
        console.error("Failed to load room categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [checkIn, checkOut, typeFilter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1E3A8A] mb-2 text-center">Our Rooms</h1>
      <p className="text-gray-500 text-center mb-10">
        {checkIn && checkOut
          ? `Showing availability for ${new Date(checkIn).toLocaleDateString()} - ${new Date(checkOut).toLocaleDateString()}`
          : "Choose a room category to explore"}
      </p>

      {loading ? (
        <p className="text-center text-gray-400">Loading rooms...</p>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <CategoryCard key={cat.type} category={cat} checkIn={checkIn} checkOut={checkOut} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No rooms match your search.</p>
      )}
    </div>
  );
};

const CategoryCard = ({ category, checkIn, checkOut }) => {
  const isSoldOut = category.availableCount === 0;
  const isLowAvailability = category.availableCount === 3 || category.availableCount === 4;

  const displayName = category.type.charAt(0).toUpperCase() + category.type.slice(1) + " Room";

  const detailsLink = `/rooms/category/${category.type}${
    checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ""
  }`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      <img
        src={
          category.image ||
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80"
        }
        alt={displayName}
        className="w-full h-56 object-cover"
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-[#1E3A8A]">{displayName}</h3>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isSoldOut ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {isSoldOut ? "Not Available" : "Available"}
          </span>
        </div>

        <p className="text-[#D4AF37] font-semibold text-lg mb-1">
          From Tk {category.minPrice} / Night
        </p>
        <p className="text-gray-500 text-sm mb-3">Capacity: up to {category.capacity} guests</p>

        {category.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category.facilities.slice(0, 4).map((f) => (
              <span key={f} className="bg-[#F8FAFC] text-gray-600 text-xs px-2 py-1 rounded">
                {f}
              </span>
            ))}
          </div>
        )}

        {isLowAvailability && (
          <p className="text-orange-600 text-sm font-medium mb-3">
            ⚠️ Only {category.availableCount} room{category.availableCount > 1 ? "s" : ""} left!
          </p>
        )}

        {isSoldOut ? (
          <button
            disabled
            className="block w-full text-center bg-gray-200 text-gray-400 py-2 rounded font-semibold cursor-not-allowed"
          >
            Currently Unavailable
          </button>
        ) : (
          <Link
            to={detailsLink}
            className="block w-full text-center bg-[#1E3A8A] text-white py-2 rounded font-semibold hover:opacity-90"
          >
            View Available Rooms
          </Link>
        )}
      </div>
    </div>
  );
};

export default Rooms;