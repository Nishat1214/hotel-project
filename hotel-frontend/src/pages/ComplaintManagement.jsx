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
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      setIsModalOpen(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update complaint");
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/complaints/${id}/close`);
      setIsModalOpen(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close complaint");
    }
  };

  const handleAssignDepartment = async (id, department) => {
    if (!department) return;
    try {
      await api.put(`/complaints/${id}`, { assignedDepartment: department });
      fetchComplaints();
      setSelected((prev) => ({ ...prev, assignedDepartment: department }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign department");
    }
  };

  const tableData = complaints.map((c) => ({
    Customer: c.customer?.name || "N/A",
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
          columns={["Customer", "Complaint", "AI Category", "Priority", "Status", "Action"]}
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

            <div className="bg-[#F8FAFC] rounded p-3 space-y-1">
              <p className="font-semibold text-[#1E3A8A]">🤖 AI Analysis</p>
              <p><strong>Category:</strong> {selected.category}</p>
              <p><strong>Priority:</strong> {selected.priority}</p>
              <p><strong>Suggested Department:</strong> {selected.department}</p>
              <p><strong>Suggested Resolution:</strong> {selected.suggestedResolution}</p>
            </div>

            <p><strong>Current Status:</strong> {selected.status}</p>
            <p><strong>Assigned To:</strong> {selected.assignedDepartment || "Not yet assigned"}</p>

            <div>
              <label className="block text-sm font-medium mb-1">Assign to Department</label>
              <select
                onChange={(e) => handleAssignDepartment(selected._id, e.target.value)}
                defaultValue=""
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="" disabled>Select department</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reception">Reception</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Accounts">Accounts</option>
              </select>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintManagement;
