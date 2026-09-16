import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Table from "../components/Table";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
  "No-Show": "bg-orange-100 text-orange-700",
};

const complaintStatusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-700",
};

const CustomerHistory = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const basePath = user?.role === "admin" ? "/admin" : "/receptionist";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/auth/customers/${id}`);
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load customer history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  if (loading) {
    return <p className="text-gray-400 text-center py-10">Loading customer history...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center py-10">{error}</p>;
  }

  const { customer, reservations, complaints, payments, summary } = data;

  const reservationData = reservations.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    "Check-out": new Date(r.checkOut).toLocaleDateString(),
    Total: `Tk ${r.totalPrice}`,
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
        {r.status}
      </span>
    ),
  }));

  const complaintData = complaints.map((c) => ({
    Complaint: c.description.length > 40 ? c.description.slice(0, 40) + "..." : c.description,
    Category: c.category,
    Priority: c.priority,
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${complaintStatusColors[c.status]}`}>
        {c.status}
      </span>
    ),
    Date: new Date(c.createdAt).toLocaleDateString(),
  }));

  const paymentData = payments.map((p) => ({
    Invoice: p.invoiceNumber,
    Total: `Tk ${p.totalAmount}`,
    Advance: `Tk ${p.advanceAmount} (${p.advanceMethod})`,
    Balance: p.balancePaid ? "Settled" : `Tk ${p.balanceAmount}`,
    Refund:
      p.refundStatus && p.refundStatus !== "None" ? (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            p.refundStatus === "Refund Due" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
          }`}
        >
          {p.refundStatus}
        </span>
      ) : (
        "—"
      ),
  }));

  return (
    <div>
      <Link to={`${basePath}/customers`} className="text-[#1E3A8A] hover:underline mb-4 inline-block text-sm">
        ← Back to Customers
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A8A] mb-1">{customer.name}</h1>
        <p className="text-gray-500 text-sm">{customer.email} · {customer.phone}</p>
        <p className="text-gray-400 text-xs mt-1">
          Customer since {new Date(customer.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-[#1E3A8A]">{summary.totalStays}</p>
          <p className="text-xs text-gray-500">Completed Stays</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{summary.noShows}</p>
          <p className="text-xs text-gray-500">No-Shows</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{summary.totalComplaints}</p>
          <p className="text-xs text-gray-500">Complaints Filed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">Tk {summary.totalPaid}</p>
          <p className="text-xs text-gray-500">Total Paid (Lifetime)</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className={`text-2xl font-bold ${summary.refundsDueCount > 0 ? "text-orange-600" : "text-gray-400"}`}>
            {summary.refundsDueCount}
          </p>
          <p className="text-xs text-gray-500">Refunds Pending</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className={`text-2xl font-bold ${summary.totalRefundsDue > 0 ? "text-orange-600" : "text-gray-400"}`}>
            Tk {summary.totalRefundsDue}
          </p>
          <p className="text-xs text-gray-500">Refund Amount Owed</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-[#1E3A8A] mb-3">Reservation History</h3>
        {reservationData.length > 0 ? (
          <Table
            columns={["Booking ID", "Room", "Check-in", "Check-out", "Total", "Status"]}
            data={reservationData}
          />
        ) : (
          <p className="text-gray-400 text-center py-6">No reservations yet.</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-[#1E3A8A] mb-3">Complaint History</h3>
        {complaintData.length > 0 ? (
          <Table columns={["Complaint", "Category", "Priority", "Status", "Date"]} data={complaintData} />
        ) : (
          <p className="text-gray-400 text-center py-6">No complaints filed.</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-[#1E3A8A] mb-3">Payment History</h3>
        {paymentData.length > 0 ? (
          <Table
            columns={["Invoice", "Total", "Advance", "Balance", "Refund"]}
            data={paymentData}
          />
        ) : (
          <p className="text-gray-400 text-center py-6">No payment records yet.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;