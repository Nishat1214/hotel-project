import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState("any");

  const today = new Date().toISOString().split("T")[0];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    if (roomType && roomType !== "any") params.set("type", roomType);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white shadow-lg rounded-lg p-6 -mt-10 relative z-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
        <input
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
        <input
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Room Type</label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="any">Any</option>
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="suite">Suite</option>
          <option value="family">Family</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-[#1E3A8A] text-white rounded px-4 py-2 font-semibold hover:opacity-90 self-end"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;