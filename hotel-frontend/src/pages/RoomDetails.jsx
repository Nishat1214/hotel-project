import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const RoomDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking form state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${id}`);
        setRoom(data);
      } catch (err) {
        setError("Room not found");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
      : 0;
  const totalPrice = room ? nights * room.price : 0;

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess(null);

    if (!user) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/reservations", {
        roomId: id,
        checkIn,
        checkOut,
        guests: Number(guests),
        paymentMethod,
      });
      setBookingSuccess(data);
    } catch (err) {
      setBookingError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading...</div>;
  }

  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Room not found</h1>
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
              room.images?.[0] ||
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80"
            }
            alt={room.roomNumber}
            className="w-full h-80 object-cover rounded-lg shadow"
          />

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-[#1E3A8A] mb-2">
              {room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room {room.roomNumber}
            </h1>
            <p className="text-2xl font-semibold text-[#D4AF37] mb-4">${room.price} / Night</p>

            <h3 className="font-semibold text-[#1E3A8A] mb-2">Facilities</h3>
            <ul className="grid grid-cols-2 gap-2 mb-6">
              {room.facilities?.length > 0 ? (
                room.facilities.map((facility) => (
                  <li key={facility} className="text-gray-600 text-sm flex items-center gap-2">
                    <span className="text-[#D4AF37]">✓</span> {facility}
                  </li>
                ))
              ) : (
                <li className="text-gray-400 text-sm">No facilities listed</li>
              )}
            </ul>

            <p className="text-sm text-gray-500">Capacity: {room.capacity} guests</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">Book This Room</h2>

          {room.status !== "Available" ? (
            <p className="bg-gray-100 text-gray-500 px-4 py-3 rounded text-center">
              Currently {room.status} — not available for booking
            </p>
          ) : bookingSuccess ? (
            <div className="bg-green-50 text-green-700 rounded p-4 text-sm space-y-1">
              <p className="font-semibold text-base mb-2">✅ Booking Confirmed!</p>
              <p><strong>Reservation ID:</strong> {bookingSuccess._id}</p>
              <p><strong>Status:</strong> {bookingSuccess.status}</p>
              <p><strong>Total:</strong> ${bookingSuccess.totalPrice}</p>
              <p className="pt-2 text-xs text-gray-500">
                A confirmation email has been sent to you.
              </p>
              <Link
                to="/customer/reservations"
                className="inline-block mt-3 text-[#1E3A8A] font-semibold hover:underline"
              >
                View My Reservations →
              </Link>
            </div>
          ) : (
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

              <label className="block text-sm font-medium mb-1">Guests</label>
              <input
                type="number"
                min="1"
                max={room.capacity}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 mb-4"
              />
              <p className="text-xs text-gray-400 -mt-3 mb-4">Max {room.capacity} guests</p>

              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-4"
              >
                <option value="online">Online Payment (instant confirmation)</option>
                <option value="offline">Pay at Hotel (offline)</option>
              </select>

              {nights > 0 && (
                <div className="bg-[#F8FAFC] rounded p-3 mb-4 text-sm">
                  <p>{nights} night{nights > 1 ? "s" : ""} × ${room.price}</p>
                  <p className="font-bold text-[#1E3A8A] text-lg mt-1">Total: ${totalPrice}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1E3A8A] text-white py-3 rounded font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submitting
                  ? "Processing..."
                  : paymentMethod === "online"
                  ? "Pay & Confirm Booking"
                  : "Reserve (Pay at Hotel)"}
              </button>

              {!user && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  You'll be asked to log in before confirming.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;