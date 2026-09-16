import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import api from "../services/api";

const ReceptionDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, reservationsRes, complaintsRes] = await Promise.all([
          api.get("/rooms"),
          api.get("/reservations"),
          api.get("/complaints"),
        ]);
        setRooms(roomsRes.data);
        setReservations(reservationsRes.data);
        setComplaints(complaintsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const refreshComplaints = async () => {
      try {
        const { data } = await api.get("/complaints");
        setComplaints(data);
      } catch (err) {
        console.error("Failed to refresh complaints", err);
      }
    };

    // Background refresh every 30 seconds, plus instant refresh on any status change
    const interval = setInterval(refreshComplaints, 30000);
    window.addEventListener("complaints-updated", refreshComplaints);

    return () => {
      clearInterval(interval);
      window.removeEventListener("complaints-updated", refreshComplaints);
    };
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

  const pendingComplaints = complaints.filter((c) => c.status === "Pending");

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
      {/* New complaint notification banner */}
      {pendingComplaints.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-red-700">
              🔔 {pendingComplaints.length} pending complaint{pendingComplaints.length > 1 ? "s" : ""} awaiting review
            </p>
            <p className="text-sm text-red-600 mt-1">
              Latest: "{pendingComplaints[0].description.slice(0, 60)}
              {pendingComplaints[0].description.length > 60 ? "..." : ""}" — {pendingComplaints[0].customer?.name}
              {pendingComplaints[0].reservation?.room && (
                <> ({pendingComplaints[0].reservation.room.type} Room {pendingComplaints[0].reservation.room.roomNumber})</>
              )}
            </p>
          </div>
          <Link
            to="/receptionist/complaints"
            className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:opacity-90 whitespace-nowrap"
          >
            View Complaints
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard label="Today's Reservations" value={todaysReservations} icon="📅" />
        <DashboardCard label="Today's Check-ins" value={todaysCheckIns} icon="🧳" color="#16A34A" />
        <DashboardCard label="Today's Check-outs" value={todaysCheckOuts} icon="🚪" color="#D4AF37" />
        <DashboardCard label="Available Rooms" value={availableRooms} icon="✅" color="#16A34A" />
        <DashboardCard
          label="Pending Complaints"
          value={pendingComplaints.length}
          icon="⚠️"
          color={pendingComplaints.length > 0 ? "#DC2626" : "#16A34A"}
        />
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