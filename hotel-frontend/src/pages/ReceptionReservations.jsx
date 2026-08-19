import { useState, useEffect } from "react";
import Table from "../components/Table";
import api from "../services/api";

const statusColors = {
  Confirmed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
};

const ReceptionReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleConfirmPayment = async (id) => {
    if (!confirm("Confirm that offline payment has been received?")) return;
    try {
      await api.put(`/reservations/${id}/confirm-payment`);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm payment");
    }
  };

  const tableData = reservations.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    "Check-out": new Date(r.checkOut).toLocaleDateString(),
    Payment: `${r.paymentMethod} (${r.paymentStatus})`,
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
        {r.status}
      </span>
    ),
    Action:
      r.paymentMethod === "offline" && r.paymentStatus === "Pending" && r.status !== "Cancelled" ? (
        <button
          onClick={() => handleConfirmPayment(r._id)}
          className="text-green-600 hover:underline text-sm"
        >
          Confirm 
        </button>
      ) : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Reservations</h1>
      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : (
        <Table
          columns={["Booking ID", "Customer", "Room", "Check-in", "Check-out", "Payment", "Status", "Action"]}
          data={tableData}
        />
      )}
    </div>
  );
};

export default ReceptionReservations;