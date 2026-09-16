import { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const statusColors = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
  "No-Show": "bg-orange-100 text-orange-700",
};

const ReceptionReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [manageModal, setManageModal] = useState(null);
  const [activeTab, setActiveTab] = useState("dates");

  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [dateError, setDateError] = useState("");

  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedNewRoom, setSelectedNewRoom] = useState("");
  const [roomChangeError, setRoomChangeError] = useState("");

  const today = new Date().toISOString().split("T")[0];

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
    if (!confirm("Cancel this reservation? The advance payment is non-refundable; any extra amount paid will be refunded.")) return;
    try {
      const { data } = await api.put(`/reservations/${id}/cancel`);
      alert(data.message);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const openManageModal = (reservation) => {
    setManageModal(reservation);
    setActiveTab("dates");
    setNewCheckIn(reservation.checkIn.split("T")[0]);
    setNewCheckOut(reservation.checkOut.split("T")[0]);
    setDateError("");
    setAvailableRooms([]);
    setSelectedNewRoom("");
    setRoomChangeError("");
  };

  const handleModifyDates = async () => {
    setDateError("");
    try {
      const { data } = await api.put(`/reservations/${manageModal._id}/modify-dates`, {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
      });
      alert(data.message);
      setManageModal(null);
      fetchReservations();
    } catch (err) {
      setDateError(err.response?.data?.message || "Failed to update dates");
    }
  };

  const loadRoomsForChange = async () => {
    setRoomChangeError("");
    try {
      const { data } = await api.get("/rooms", {
        params: {
          type: manageModal.room.type,
          status: "Available",
          checkIn: manageModal.checkIn.split("T")[0],
          checkOut: manageModal.checkOut.split("T")[0],
        },
      });
      const filtered = data.filter((r) => r._id !== manageModal.room._id);
      setAvailableRooms(filtered);
      setSelectedNewRoom(filtered.length > 0 ? filtered[0]._id : "");
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "room" && availableRooms.length === 0) {
      loadRoomsForChange();
    }
  };

  const handleChangeRoom = async () => {
    if (!selectedNewRoom) return;
    setRoomChangeError("");
    try {
      const { data } = await api.put(`/reservations/${manageModal._id}/change-room`, {
        newRoomId: selectedNewRoom,
      });
      alert(data.message);
      setManageModal(null);
      fetchReservations();
    } catch (err) {
      setRoomChangeError(err.response?.data?.message || "Failed to change room");
    }
  };

  const tableData = reservations.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    Source: r.bookingSource === "receptionist" ? "Walk-in" : "Online",
    "Check-in": new Date(r.checkIn).toLocaleDateString(),
    "Advance / Balance": `Tk ${r.advanceAmount} / Tk ${r.paymentStatus === "Paid" ? 0 : r.balanceAmount}`,
    "Refund Due": r.status === "Cancelled" && r.refundAmount > 0 ? `Tk ${r.refundAmount}` : "—",
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
        {r.status}
      </span>
    ),
    Action:
      r.status !== "Cancelled" && r.status !== "Completed" && r.status !== "No-Show" ? (
        <div className="flex gap-3">
          <button onClick={() => openManageModal(r)} className="text-[#1E3A8A] hover:underline text-sm">
            Manage
          </button>
          {!r.checkedIn && (
            <button onClick={() => handleCancel(r._id)} className="text-red-600 hover:underline text-sm">
              Cancel
            </button>
          )}
        </div>
      ) : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Reservations</h1>
      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : reservations.length > 0 ? (
        <Table
          columns={["Booking ID", "Customer", "Room", "Source", "Check-in", "Advance / Balance", "Refund Due", "Status", "Action"]}
          data={tableData}
        />
      ) : (
        <p className="text-gray-400 text-center py-10">No reservations yet.</p>
      )}

      <Modal isOpen={!!manageModal} onClose={() => setManageModal(null)} title="Manage Reservation">
        {manageModal && (
          <div>
            <p className="text-sm mb-3">
              <strong>Guest:</strong> {manageModal.customer?.name} — {manageModal.room?.type} Room{" "}
              {manageModal.room?.roomNumber}
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleTabChange("dates")}
                className={`flex-1 py-2 rounded text-sm font-semibold ${
                  activeTab === "dates" ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Modify Dates
              </button>
              <button
                onClick={() => handleTabChange("room")}
                className={`flex-1 py-2 rounded text-sm font-semibold ${
                  activeTab === "room" ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Change Room
              </button>
            </div>

            {activeTab === "dates" ? (
              <>
                {dateError && (
                  <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-3">{dateError}</p>
                )}
                <label className="block text-sm font-medium mb-1">Check-in</label>
                <input
                  type="date"
                  value={newCheckIn}
                  min={today}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-3"
                />
                <label className="block text-sm font-medium mb-1">Check-out</label>
                <input
                  type="date"
                  value={newCheckOut}
                  min={newCheckIn || today}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-4"
                />
                <p className="text-xs text-gray-500 mb-4">
                  Note: changing dates recalculates the total price and remaining balance. The advance
                  already paid stays the same.
                </p>
                <button
                  onClick={handleModifyDates}
                  className="w-full bg-[#1E3A8A] text-white py-2 rounded font-semibold hover:opacity-90"
                >
                  Save New Dates
                </button>
              </>
            ) : (
              <>
                {roomChangeError && (
                  <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-3">{roomChangeError}</p>
                )}
                {availableRooms.length > 0 ? (
                  <>
                    <label className="block text-sm font-medium mb-1">Move to</label>
                    <select
                      value={selectedNewRoom}
                      onChange={(e) => setSelectedNewRoom(e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-4"
                    >
                      {availableRooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.type} Room {r.roomNumber} — Tk {r.price}/night
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleChangeRoom}
                      className="w-full bg-[#D4AF37] text-[#1E3A8A] py-2 rounded font-semibold hover:opacity-90"
                    >
                      Move Guest
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No other {manageModal.room?.type} rooms available for these dates.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceptionReservations;