import { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import api from "../services/api";

const ReceptionDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, reservationsRes] = await Promise.all([
          api.get("/rooms"),
          api.get("/reservations"),
        ]);
        setRooms(roomsRes.data);
        setReservations(reservationsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const todaysReservations = reservations.filter((r) => isToday(r.checkIn)).length;
  const todaysCheckIns = reservations.filter(
    (r) => isToday(r.checkIn) && r.status === "Confirmed"
  ).length;
  const todaysCheckOuts = reservations.filter((r) => isToday(r.checkOut)).length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const occupiedRooms = rooms.filter(
    (r) => r.status === "Occupied" || r.status === "Reserved"
  ).length;

  const recent = reservations.slice(0, 5).map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    Status: r.status,
  }));

  if (loading) {
    return <p className="text-gray-400 text-center py-10">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard label="Today's Reservations" value={todaysReservations} icon="📅" />
        <DashboardCard label="Today's Check-ins" value={todaysCheckIns} icon="🧳" color="#16A34A" />
        <DashboardCard label="Today's Check-outs" value={todaysCheckOuts} icon="🚪" color="#D4AF37" />
        <DashboardCard label="Available Rooms" value={availableRooms} icon="✅" color="#16A34A" />
        <DashboardCard label="Occupied Rooms" value={occupiedRooms} icon="🛏️" color="#DC2626" />
      </div>

      <div>
        <h3 className="font-semibold text-[#1E3A8A] mb-4">Recent Reservations</h3>
        {recent.length > 0 ? (
          <Table
            columns={["Booking ID", "Customer", "Room", "Check-in", "Status"]}
            data={recent}
          />
        ) : (
          <p className="text-gray-400 text-center py-6">No reservations yet.</p>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;

