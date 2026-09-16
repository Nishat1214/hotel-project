import { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-700",
};

const priorityColors = {
  Critical: "bg-red-200 text-red-800",
  High: "bg-red-100 text-red-700",
  Medium: "bg-orange-100 text-orange-700",
  Low: "bg-gray-100 text-gray-700",
};

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedNewRoom, setSelectedNewRoom] = useState("");
  const [showRoomChange, setShowRoomChange] = useState(false);
  const [roomChangeError, setRoomChangeError] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/complaints");
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openComplaint = (complaint) => {
    setSelected(complaint);
    setIsModalOpen(true);
    setShowRoomChange(false);
    setRoomChangeError("");
    setAvailableRooms([]);
    setSelectedNewRoom("");
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      setIsModalOpen(false);
      fetchComplaints();
      window.dispatchEvent(new Event("complaints-updated"));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update complaint");
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/complaints/${id}/close`);
      setIsModalOpen(false);
      fetchComplaints();
      window.dispatchEvent(new Event("complaints-updated"));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close complaint");
    }
  };

  const toggleDepartment = (dept) => {
    setSelected((prev) => {
      const current = prev.assignedDepartments || [];
      const updated = current.includes(dept)
        ? current.filter((d) => d !== dept)
        : [...current, dept];
      return { ...prev, assignedDepartments: updated };
    });
  };

  const handleSaveDepartments = async () => {
    try {
      await api.put(`/complaints/${selected._id}`, {
        assignedDepartments: selected.assignedDepartments || [],
      });
      fetchComplaints();
      alert("Departments updated");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign departments");
    }
  };

  const openRoomChange = async () => {
    setRoomChangeError("");
    setShowRoomChange(true);
    if (!selected.reservation?.room) return;

    try {
      const { data } = await api.get("/rooms", {
        params: {
          type: selected.reservation.room.type,
          status: "Available",
          checkIn: selected.reservation.checkIn,
          checkOut: selected.reservation.checkOut,
        },
      });
      setAvailableRooms(data);
      setSelectedNewRoom(data.length > 0 ? data[0]._id : "");
    } catch (err) {
      console.error("Failed to load available rooms", err);
    }
  };

  const handleChangeRoom = async () => {
    if (!selectedNewRoom) return;
    setRoomChangeError("");
    try {
      const { data } = await api.put(`/complaints/${selected._id}/change-room`, {
        newRoomId: selectedNewRoom,
      });
      alert(data.message);
      setShowRoomChange(false);
      setIsModalOpen(false);
      fetchComplaints();
      window.dispatchEvent(new Event("complaints-updated"));
    } catch (err) {
      setRoomChangeError(err.response?.data?.message || "Failed to change room");
    }
  };

  const tableData = complaints.map((c) => ({
    Customer: c.customer?.name || "N/A",
    Room: c.reservation?.room
      ? `${c.reservation.room.type} Room ${c.reservation.room.roomNumber}${
          c.reservation.status === "Completed" ? " (checked out)" : ""
        }`
      : "N/A",
    Complaint: c.description.length > 40 ? c.description.slice(0, 40) + "..." : c.description,
    "AI Category": c.category,
    Priority: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[c.priority]}`}>
        {c.priority}
      </span>
    ),
    Status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
        {c.status}
      </span>
    ),
    Action: (
      <button onClick={() => openComplaint(c)} className="text-[#1E3A8A] hover:underline text-sm">
        View
      </button>
    ),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Complaints</h1>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading complaints...</p>
      ) : complaints.length > 0 ? (
        <Table
          columns={["Customer", "Room", "Complaint", "AI Category", "Priority", "Status", "Action"]}
          data={tableData}
        />
      ) : (
        <p className="text-gray-400 text-center py-10">No complaints yet.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Complaint Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-700 italic">"{selected.description}"</p>
            <p><strong>Customer:</strong> {selected.customer?.name}</p>
            {selected.reservation?.room && (
              <p>
                <strong>Room:</strong> {selected.reservation.room.type} Room{" "}
                {selected.reservation.room.roomNumber}
              </p>
            )}
            {selected.reservation?.status === "Completed" && (
              <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full">
                🚪 Guest Checked Out
              </span>
            )}

            <div className="bg-[#F8FAFC] rounded p-3 space-y-1">
              <p className="font-semibold text-[#1E3A8A]">🤖 AI Analysis</p>
              <p><strong>Category:</strong> {selected.category}</p>
              <p><strong>Priority:</strong> {selected.priority}</p>
              <p><strong>Suggested Department:</strong> {selected.department}</p>
              <p><strong>Suggested Resolution:</strong> {selected.suggestedResolution}</p>
            </div>

            <p><strong>Current Status:</strong> {selected.status}</p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {selected.assignedDepartments?.length > 0
                ? selected.assignedDepartments.join(", ")
                : "Not yet assigned"}
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">Assign to Department(s)</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {["Housekeeping", "Maintenance", "Reception", "Restaurant", "Accounts"].map((dept) => (
                  <label key={dept} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.assignedDepartments?.includes(dept) || false}
                      onChange={() => toggleDepartment(dept)}
                    />
                    {dept}
                  </label>
                ))}
              </div>
              <button
                onClick={handleSaveDepartments}
                className="w-full bg-[#1E3A8A] text-white py-2 rounded text-sm font-semibold hover:opacity-90"
              >
                Save Department Assignment
              </button>
            </div>

            {selected.status !== "Closed" && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status !== "In Progress" && (
                  <button
                    onClick={() => handleUpdateStatus(selected._id, "In Progress")}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:opacity-90 text-sm"
                  >
                    In Progress
                  </button>
                )}
                {selected.status !== "Resolved" && (
                  <button
                    onClick={() => handleUpdateStatus(selected._id, "Resolved")}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:opacity-90 text-sm"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => handleClose(selected._id)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:opacity-90 text-sm"
                >
                  Close
                </button>
              </div>
            )}

            {selected.reservation?.room &&
              selected.status !== "Closed" &&
              selected.reservation?.status !== "Completed" &&
              selected.reservation?.status !== "Cancelled" && (
              <div className="pt-2">
                {!showRoomChange ? (
                  <button
                    onClick={openRoomChange}
                    className="w-full bg-orange-500 text-white py-2 rounded hover:opacity-90 text-sm font-semibold"
                  >
                    🔁 Can't Fix — Change Guest's Room
                  </button>
                ) : (
                  <div className="bg-orange-50 rounded p-3 mt-2 space-y-2">
                    <p className="font-semibold text-orange-700 text-sm">
                      Move guest from {selected.reservation.room.type} Room {selected.reservation.room.roomNumber}
                    </p>
                    {roomChangeError && (
                      <p className="text-red-600 text-xs">{roomChangeError}</p>
                    )}
                    {availableRooms.length > 0 ? (
                      <>
                        <select
                          value={selectedNewRoom}
                          onChange={(e) => setSelectedNewRoom(e.target.value)}
                          className="w-full border rounded px-3 py-2 text-sm"
                        >
                          {availableRooms.map((r) => (
                            <option key={r._id} value={r._id}>
                              {r.type} Room {r.roomNumber} — Tk {r.price}/night
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRoomChange(false)}
                            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleChangeRoom}
                            className="flex-1 bg-orange-500 text-white py-2 rounded text-sm font-semibold hover:opacity-90"
                          >
                            Confirm Move
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No other {selected.reservation.room.type} rooms available for these dates.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintManagement;