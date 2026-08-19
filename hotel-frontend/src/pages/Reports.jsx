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
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

const COLORS = ["#1E3A8A", "#D4AF37", "#16A34A", "#DC2626"];

const Reports = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [reservationReport, setReservationReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [occupancyReport, setOccupancyReport] = useState(null);
  const [complaintReport, setComplaintReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [resRes, revRes, occRes, compRes] = await Promise.all([
        api.get("/reports/reservations", { params }),
        api.get("/reports/revenue", { params }),
        api.get("/reports/occupancy"),
        api.get("/reports/complaints", { params }),
      ]);

      setReservationReport(resRes.data);
      setRevenueReport(revRes.data);
      setOccupancyReport(occRes.data);
      setComplaintReport(compRes.data);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const reservationPieData = reservationReport
    ? [
        { name: "Confirmed", value: reservationReport.confirmed },
        { name: "Pending", value: reservationReport.pending },
        { name: "Cancelled", value: reservationReport.cancelled },
        { name: "Completed", value: reservationReport.completed },
      ].filter((d) => d.value > 0)
    : [];

  const occupancyPieData = occupancyReport
    ? [
        { name: "Available", value: occupancyReport.available },
        { name: "Reserved", value: occupancyReport.reserved },
        { name: "Occupied", value: occupancyReport.occupied },
        { name: "Maintenance", value: occupancyReport.maintenance },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return <p className="text-gray-400 text-center py-10">Loading reports...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Reports</h1>
        <button
          onClick={() => window.print()}
          className="bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:opacity-90"
        >
          Export / Print
        </button>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={fetchReports}
          className="bg-[#D4AF37] text-[#1E3A8A] px-4 py-2 rounded font-semibold hover:opacity-90"
        >
          Apply Filter
        </button>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setTimeout(fetchReports, 0);
            }}
            className="text-gray-500 text-sm hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">
            Tk {revenueReport?.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Reservations</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">{reservationReport?.totalReservations}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Occupancy Rate</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">{occupancyReport?.occupancyPercentage}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Complaints</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">{complaintReport?.totalComplaints}</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-[#1E3A8A] mb-4">
          Daily Revenue {revenueReport?.dailyRevenue.length === 0 && "(no paid bookings in range)"}
        </h3>
        {revenueReport?.dailyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueReport.dailyRevenue}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#1E3A8A" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">No revenue data for this period.</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Average booking value: Tk {revenueReport?.averageBookingValue} across{" "}
          {revenueReport?.totalPaidBookings} paid bookings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#1E3A8A] mb-4">Reservation Status</h3>
          {reservationPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reservationPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {reservationPieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No reservations in this period.</p>
          )}
        </div>

        {/* Room Occupancy */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#1E3A8A] mb-4">Room Occupancy (Current)</h3>
          {occupancyPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No rooms found.</p>
          )}
        </div>
      </div>

      {/* Complaint Categories */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-[#1E3A8A] mb-4">Complaints by Category</h3>
        {complaintReport?.byCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={complaintReport.byCategory}>
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">No complaint data in this period.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="bg-yellow-50 rounded p-2 text-center">
            <p className="font-bold text-yellow-700">{complaintReport?.pending}</p>
            <p className="text-yellow-600 text-xs">Pending</p>
          </div>
          <div className="bg-blue-50 rounded p-2 text-center">
            <p className="font-bold text-blue-700">{complaintReport?.inProgress}</p>
            <p className="text-blue-600 text-xs">In Progress</p>
          </div>
          <div className="bg-green-50 rounded p-2 text-center">
            <p className="font-bold text-green-700">{complaintReport?.resolved}</p>
            <p className="text-green-600 text-xs">Resolved</p>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <p className="font-bold text-gray-700">{complaintReport?.closed}</p>
            <p className="text-gray-600 text-xs">Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;