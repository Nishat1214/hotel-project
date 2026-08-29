import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import api from "../services/api";

const ADVANCE_PERCENTAGE = 0.2;

const RoomCategoryDetails = () => {
  const { type } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(true);

   const [searchParams] = useSearchParams();
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = { type, status: "Available" };
      if (checkIn && checkOut) {
        params.checkIn = checkIn;
        params.checkOut = checkOut;
      }
      const { data } = await api.get("/rooms", { params });
      setRooms(data);
      setSelectedRoomId(data.length > 0 ? data[0]._id : null);
    } catch (err) {
      console.error("Failed to load rooms", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [type]);

  useEffect(() => {
    if (checkIn && checkOut) {
      fetchRooms();
    }
  }, [checkIn, checkOut]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
      : 0;
  const totalPrice = selectedRoom ? nights * selectedRoom.price : 0;
  const advanceAmount = Math.round(totalPrice * ADVANCE_PERCENTAGE);
  const balanceAmount = totalPrice - advanceAmount;

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!user) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/payments/sslcommerz/init", {
        roomId: selectedRoomId,
        checkIn,
        checkOut,
        guests: Number(guests),
      });

      window.location.href = data.gatewayUrl;
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to start payment. Please try again.");
      setSubmitting(false);
    }
  };

  const displayName = type.charAt(0).toUpperCase() + type.slice(1) + " Room";

  if (loading && rooms.length === 0) {
    return <div className="text-center py-16 text-gray-400">Loading...</div>;
  }

  if (!loading && rooms.length === 0 && !checkIn && !checkOut) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">No {displayName}s available right now</h1>
        <Link to="/rooms" className="text-[#D4AF37] hover:underline mt-4 inline-block">
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link to="/rooms" className="text-[#1E3A8A] hover:underline mb-6 inline-block">
        ← Back to Rooms
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <img
            src={
              selectedRoom?.images?.[0] ||
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80"
            }
            alt={displayName}
            className="w-full h-80 object-cover rounded-lg shadow"
          />

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-[#1E3A8A] mb-2">{displayName}</h1>
            <p className="text-2xl font-semibold text-[#D4AF37] mb-4">
              Tk {selectedRoom?.price ?? "—"} / Night
            </p>

            <h3 className="font-semibold text-[#1E3A8A] mb-2">Facilities</h3>
            <ul className="grid grid-cols-2 gap-2 mb-6">
              {selectedRoom?.facilities?.length > 0 ? (
                selectedRoom.facilities.map((facility) => (
                  <li key={facility} className="text-gray-600 text-sm flex items-center gap-2">
                    <span className="text-[#D4AF37]">✓</span> {facility}
                  </li>
                ))
              ) : (
                <li className="text-gray-400 text-sm">No facilities listed</li>
              )}
            </ul>

            <p className="text-sm text-gray-500">
              Capacity: up to {selectedRoom?.capacity ?? "—"} guests
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {rooms.length} room{rooms.length !== 1 ? "s" : ""} of this type currently available
              {checkIn && checkOut ? " for your selected dates" : ""}
            </p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Book This Room</h2>

          <form onSubmit={handleBooking}>
            {bookingError && (
              <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">
                {bookingError}
              </p>
            )}

            <label className="block text-sm font-medium mb-1">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />

            {checkIn && checkOut && !loading && rooms.length === 0 && (
              <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">
                No {type} rooms are available for these exact dates. Please try different dates.
              </p>
            )}

            <label className="block text-sm font-medium mb-1">Guests</label>
            <input
              type="number"
              min="1"
              max={selectedRoom?.capacity}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              required
              disabled={rooms.length === 0}
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <p className="text-xs text-gray-400 -mt-3 mb-4">
              Max {selectedRoom?.capacity ?? "—"} guests
            </p>

            {nights > 0 && selectedRoom && (
              <div className="bg-[#F8FAFC] rounded p-3 mb-4 text-sm space-y-1">
                <p>{nights} night{nights > 1 ? "s" : ""} × Tk {selectedRoom.price}</p>
                <p className="font-bold text-[#1E3A8A]">Total: Tk {totalPrice}</p>
                <div className="pt-2 border-t mt-2">
                  <p className="text-[#D4AF37] font-semibold">
                    Advance to pay now (20%): Tk {advanceAmount}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Remaining Tk {balanceAmount} due at checkout
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || nights === 0 || rooms.length === 0}
              className="w-full bg-[#1E3A8A] text-white py-3 rounded font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? "Redirecting to payment gateway..."
                : rooms.length === 0
                ? "No rooms available for these dates"
                : nights > 0
                ? `Pay Advance (Tk ${advanceAmount}) via SSLCommerz`
                : "Select dates to continue"}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              {!user
                ? "You'll be asked to log in before confirming."
                : "You'll be redirected to our secure payment gateway (sandbox)."}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomCategoryDetails;