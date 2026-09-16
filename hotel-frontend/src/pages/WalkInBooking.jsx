import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ADVANCE_PERCENTAGE = 0.2;
const ROOM_TYPES = ["standard", "deluxe", "suite", "family"];

const WalkInBooking = () => {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });

  const [roomType, setRoomType] = useState("standard");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [advanceMethod, setAdvanceMethod] = useState("cash"); // cash | card
  const [paymentOption, setPaymentOption] = useState("advance"); // "advance" | "full"

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const { data } = await api.get("/rooms", { params: { type: roomType, status: "Available" } });
        setAvailableRooms(data);
        setSelectedRoomId(data.length > 0 ? data[0]._id : "");
      } catch (err) {
        console.error("Failed to load rooms", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [roomType]);

  const selectedRoom = availableRooms.find((r) => r._id === selectedRoomId);

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
      : 0;
  const totalPrice = selectedRoom ? nights * selectedRoom.price : 0;
  const advanceAmount = Math.round(totalPrice * ADVANCE_PERCENTAGE);
  const balanceAmount = totalPrice - advanceAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (fieldErrors.email || fieldErrors.phone) {
      setError("Please fix the errors in the form before submitting");
      return;
    }

    if (!selectedRoomId) {
      setError("Please select a room");
      return;
    }

    setSubmitting(true);

    const payload = {
      guestName,
      guestEmail,
      guestPhone,
      roomId: selectedRoomId,
      checkIn,
      checkOut,
      guests: Number(guests),
      paymentOption,
    };

    try {
      const { data } = await api.post("/reservations/walkin", {
        ...payload,
        advancePaymentMethod: advanceMethod,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">New Walk-in Booking</h1>

      {success ? (
        <div className="bg-green-50 text-green-700 rounded-lg p-6 text-sm space-y-2">
          <p className="font-semibold text-base mb-2">✅ Booking Confirmed!</p>
          <p><strong>Reservation ID:</strong> {success._id.slice(-6).toUpperCase()}</p>
          <p><strong>Guest:</strong> {guestName}</p>
          <p>
            <strong>Paid Now ({success.advancePaymentMethod}):</strong> Tk {success.advanceAmount}
          </p>
          <p><strong>Balance Due at Checkout:</strong> Tk {success.balanceAmount}</p>
          <div className="flex gap-3 pt-3">
            <Link
              to="/receptionist/reservations"
              className="bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:opacity-90"
            >
              View Reservations
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setGuestName("");
                setGuestEmail("");
                setGuestPhone("");
                setCheckIn("");
                setCheckOut("");
                setGuests(1);
                setPaymentOption("advance");
                setFieldErrors({ email: "", phone: "" });
              }}
              className="border border-[#1E3A8A] text-[#1E3A8A] px-4 py-2 rounded font-semibold hover:bg-gray-50"
            >
              New Booking
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">{error}</p>
          )}

          <div>
            <h3 className="font-semibold text-[#1E3A8A] mb-2">Guest Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone (digits only)"
                value={guestPhone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setGuestPhone(digitsOnly);
                  setFieldErrors((prev) => ({
                    ...prev,
                    phone: digitsOnly.length > 0 && digitsOnly.length < 10 ? "Phone number seems too short" : "",
                  }));
                }}
                required
                inputMode="numeric"
                className={`border rounded px-3 py-2 ${fieldErrors.phone ? "border-red-400" : ""}`}
              />
              <input
                type="email"
                placeholder="Email"
                value={guestEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setGuestEmail(value);
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: value.length > 0 && !emailRegex.test(value) ? "Please enter a valid email address" : "",
                  }));
                }}
                required
                className={`border rounded px-3 py-2 sm:col-span-2 ${fieldErrors.email ? "border-red-400" : ""}`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs sm:col-span-2 -mt-2">{fieldErrors.email}</p>
              )}
              {fieldErrors.phone && (
                <p className="text-red-500 text-xs sm:col-span-2 -mt-2">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A8A] mb-2">Room Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>

              {loadingRooms ? (
                <p className="text-gray-400 text-sm self-center">Loading rooms...</p>
              ) : availableRooms.length > 0 ? (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  {availableRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Room {r.roomNumber} — Tk {r.price}/night
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-red-500 text-sm self-center">No {roomType} rooms available</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A8A] mb-2">Stay Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Guests {selectedRoom && `(max ${selectedRoom.capacity})`}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom?.capacity}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          {nights > 0 && selectedRoom && (
            <>
              <label className="block text-sm font-medium mb-2">Payment Amount</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="advance"
                    checked={paymentOption === "advance"}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  Advance Only (20%)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="full"
                    checked={paymentOption === "full"}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  Pay Full Amount Now
                </label>
              </div>

              <div className="bg-[#F8FAFC] rounded p-3 text-sm space-y-1">
                <p>{nights} night{nights > 1 ? "s" : ""} × Tk {selectedRoom.price}</p>
                <p className="font-bold text-[#1E3A8A]">Total: Tk {totalPrice}</p>
                {paymentOption === "full" ? (
                  <p className="text-green-600 font-semibold pt-1 border-t mt-1">
                    Collecting full amount now — ready to check in immediately
                  </p>
                ) : (
                  <>
                    <p className="text-[#D4AF37] font-semibold pt-1 border-t mt-1">
                      Advance (20%): Tk {advanceAmount}
                    </p>
                    <p className="text-gray-500 text-xs">Balance Tk {balanceAmount} due at checkout</p>
                  </>
                )}
              </div>
            </>
          )}

          <div>
            <h3 className="font-semibold text-[#1E3A8A] mb-2">Payment Method</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="advanceMethod"
                  value="cash"
                  checked={advanceMethod === "cash"}
                  onChange={(e) => setAdvanceMethod(e.target.value)}
                />
                Cash (collected now)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="advanceMethod"
                  value="card"
                  checked={advanceMethod === "card"}
                  onChange={(e) => setAdvanceMethod(e.target.value)}
                />
                Card (collected now)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedRoomId || nights === 0}
            className="w-full bg-[#1E3A8A] text-white py-3 rounded font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Processing..."
              : paymentOption === "full"
              ? `Confirm Booking (${advanceMethod === "cash" ? "Cash" : "Card"} — Full Tk ${totalPrice})`
              : `Confirm Booking (${advanceMethod === "cash" ? "Cash" : "Card"} Advance Tk ${advanceAmount})`}
          </button>
        </form>
      )}
    </div>
  );
};

export default WalkInBooking;