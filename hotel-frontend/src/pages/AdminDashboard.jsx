import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import api from "../services/api";

const revenueData = [
  { day: "Mon", revenue: 400 },
  { day: "Tue", revenue: 620 },
  { day: "Wed", revenue: 380 },
  { day: "Thu", revenue: 700 },
  { day: "Fri", revenue: 900 },
  { day: "Sat", revenue: 1200 },
  { day: "Sun", revenue: 800 },
];

const reservationData = [
  { day: "Mon", bookings: 3 },
  { day: "Tue", bookings: 5 },
  { day: "Wed", bookings: 2 },
  { day: "Thu", bookings: 6 },
  { day: "Fri", bookings: 8 },
  { day: "Sat", bookings: 10 },
  { day: "Sun", bookings: 7 },
];

const COLORS = ["#1E3A8A", "#D4AF37"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    revenue: 0,
    complaints: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roomsRes, reservationsRes] = await Promise.all([
          api.get("/rooms"),
          api.get("/reservations"),
        ]);

        const rooms = roomsRes.data;
        const reservations = reservationsRes.data;

        const availableRooms = rooms.filter((r) => r.status === "Available").length;
        const occupiedRooms = rooms.filter(
          (r) => r.status === "Occupied" || r.status === "Reserved"
        ).length;
        const revenue = reservations
          .filter((r) => r.paymentStatus === "Paid")
          .reduce((sum, r) => sum + r.totalPrice, 0);

        setStats({
          totalRooms: rooms.length,
          availableRooms,
          occupiedRooms,
          revenue,
          complaints: 0,
        });

        setRecentReservations(
          reservations.slice(0, 5).map((r) => ({
            "Booking ID": r._id.slice(-6).toUpperCase(),
            Customer: r.customer?.name || "N/A",
            Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
            "Check-in": new Date(r.checkIn).toLocaleDateString(),
            Status: r.status,
          }))
        );
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const occupancyData = [
    { name: "Occupied", value: stats.occupiedRooms },
    { name: "Available", value: stats.availableRooms },
  ];

  if (loading) {
    return <p className="text-gray-400 text-center py-10">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard label="Total Rooms" value={stats.totalRooms} icon="🏨" />
        <DashboardCard label="Available Rooms" value={stats.availableRooms} icon="✅" color="#16A34A" />
        <DashboardCard label="Occupied Rooms" value={stats.occupiedRooms} icon="🛏️" color="#D4AF37" />
        <DashboardCard label="Revenue" value={`৳${stats.revenue}`} icon="💰" color="#16A34A" />
        <DashboardCard label="Complaints" value={stats.complaints} icon="⚠️" color="#DC2626" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <h3 className="font-semibold text-[#1E3A8A] mb-4">Revenue (This Week)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#1E3A8A" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#1E3A8A] mb-4">Occupancy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={occupancyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-[#1E3A8A] mb-4">Reservations (This Week)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reservationData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="bookings" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Reservations Table */}
      <div>
        <h3 className="font-semibold text-[#1E3A8A] mb-4">Recent Reservations</h3>
        {recentReservations.length > 0 ? (
          <Table
            columns={["Booking ID", "Customer", "Room", "Check-in", "Status"]}
            data={recentReservations}
          />
        ) : (
          <p className="text-gray-400 text-center py-6">No reservations yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;