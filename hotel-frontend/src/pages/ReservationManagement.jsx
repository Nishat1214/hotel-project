import { useState, useEffect } from "react";
import Table from "../components/Table";
import api from "../services/api";

const statusColors = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
};

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reservations");
      setReservations(data);
    } catch (err) {
      console.error("Failed to load reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this reservation? The advance payment is non-refundable.")) return;
    try {
      const { data } = await api.put(`/reservations/${id}/cancel`);
      alert(data.message);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const filtered = filterStatus === "all" ? reservations : reservations.filter((r) => r.status === filterStatus);

  const tableData = filtered.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    Source: r.bookingSource === "receptionist" ? "Walk-in" : "Online",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    "Advance / Balance": `Tk ${r.advanceAmount} / Tk ${r.paymentStatus === "Fully Paid" || r.paymentStatus === "Paid" ? 0 : r.balanceAmount}`,
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
        {r.status}
      </span>
    ),
    Action:
      r.status !== "Cancelled" && r.status !== "Completed" && !r.checkedIn ? (
        <button onClick={() => handleCancel(r._id)} className="text-red-600 hover:underline text-sm">
          Cancel
        </button>
      ) : null,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Reservation Management</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : (
        <Table
          columns={["Booking ID", "Customer", "Room", "Source", "Check-in", "Advance / Balance", "Status", "Action"]}
          data={tableData}
        />
      )}
    </div>
  );
};

export default ReservationManagement;