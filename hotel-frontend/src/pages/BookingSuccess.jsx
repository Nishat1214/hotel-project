import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("id");
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const { data } = await api.get("/reservations");
        const found = data.find((r) => r._id === reservationId);
        setReservation(found);
      } catch (err) {
        console.error("Failed to load reservation", err);
      } finally {
        setLoading(false);
      }
    };
    if (reservationId) fetchReservation();
    else setLoading(false);
  }, [reservationId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your advance payment was successful.</p>

        {loading ? (
          <p className="text-gray-400">Loading details...</p>
        ) : reservation ? (
          <div className="bg-[#F8FAFC] rounded p-4 text-left text-sm space-y-2 mb-6">
            <p><strong>Reservation ID:</strong> {reservation._id.slice(-6).toUpperCase()}</p>
            <p>
              <strong>Room:</strong> {reservation.room?.type} Room {reservation.room?.roomNumber}
            </p>
            <p><strong>Check-in:</strong> {new Date(reservation.checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(reservation.checkOut).toLocaleDateString()}</p>
            <p><strong>Advance Paid:</strong> Tk {reservation.advanceAmount}</p>
            <p><strong>Balance Due at Checkout:</strong> Tk {reservation.balanceAmount}</p>
          </div>
        ) : (
          <p className="text-gray-400 mb-6">A confirmation email has been sent to you.</p>
        )}

        <Link
          to="/customer/reservations"
          className="inline-block bg-[#1E3A8A] text-white px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          View My Reservations
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;