import { useState, useEffect } from "react";
import Table from "../components/Table";
import api from "../services/api";

const statusColors = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
  "No-Show": "bg-orange-100 text-orange-700",
};

const MyReservations = () => {
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

  const tableData = reservations.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    "Check-out": new Date(r.checkOut).toLocaleDateString(),
    "Advance Paid": `Tk ${r.advanceAmount}`,
    "Balance Due": r.paymentStatus === "Paid" ? "Tk 0" : `Tk ${r.balanceAmount}`,
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
        {r.status}
      </span>
    ),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">My Reservations</h1>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : reservations.length > 0 ? (
        <Table
          columns={["Booking ID", "Room", "Check-in", "Check-out", "Advance Paid", "Balance Due", "Status"]}
          data={tableData}
        />
      ) : (
        <p className="text-gray-400 text-center py-10">No reservations yet.</p>
      )}

      <p className="text-xs text-gray-400 mt-4">
        To cancel or modify a reservation, please contact the front desk. Advance payments are non-refundable.
      </p>
    </div>
  );
};

export default MyReservations;