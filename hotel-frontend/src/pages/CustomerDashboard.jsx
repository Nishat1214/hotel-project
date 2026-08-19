import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api";

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const { data } = await api.get("/reservations");
        setReservations(data);
      } catch (err) {
        console.error("Failed to load reservations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  // Find the next upcoming stay (Confirmed or Pending, check-in in the future)
  const upcoming = reservations
    .filter((r) => (r.status === "Confirmed" || r.status === "Pending") && new Date(r.checkIn) >= new Date())
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))[0];

  const activeReservationsCount = reservations.filter(
    (r) => r.status === "Confirmed" || r.status === "Pending"
  ).length;

  if (loading) {
    return <p className="text-gray-400 text-center py-10">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          label="Upcoming Stay"
          value={upcoming ? `${upcoming.room?.type} Room ${upcoming.room?.roomNumber}` : "None"}
          icon="🛎️"
        />
        <DashboardCard label="Active Reservations" value={activeReservationsCount} icon="📅" color="#16A34A" />
        <DashboardCard label="Total Bookings" value={reservations.length} icon="📖" color="#D4AF37" />
      </div>

      {upcoming ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-[#1E3A8A] mb-3">Your Upcoming Stay</h3>
          <p><strong>Room:</strong> {upcoming.room?.type} Room {upcoming.room?.roomNumber}</p>
          <p><strong>Check-in:</strong> {new Date(upcoming.checkIn).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> {new Date(upcoming.checkOut).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {upcoming.status}</p>
          <p><strong>Total Paid:</strong> ${upcoming.totalPrice}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
          No upcoming stays. Book a room to get started!
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-4">
        <Link
          to="/rooms"
          className="bg-[#1E3A8A] text-white px-5 py-2 rounded font-semibold hover:opacity-90"
        >
          Book a New Room
        </Link>
        <Link
          to="/customer/reservations"
          className="border border-[#1E3A8A] text-[#1E3A8A] px-5 py-2 rounded font-semibold hover:bg-gray-50"
        >
          View All Reservations
        </Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;