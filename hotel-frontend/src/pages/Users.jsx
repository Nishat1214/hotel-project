import { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const Users = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "receptionist",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/staff");
      setStaff(data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staff account?")) return;
    try {
      await api.delete(`/auth/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff account");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: only allow digits to actually be entered
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData({ ...formData, phone: digitsOnly });

      setFieldErrors((prev) => ({
        ...prev,
        phone: digitsOnly.length > 0 && digitsOnly.length < 10 ? "Phone number seems too short" : "",
      }));
      return;
    }

    setFormData({ ...formData, [name]: value });

    // Email: validate format live
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setFieldErrors((prev) => ({
        ...prev,
        email: value.length > 0 && !emailRegex.test(value) ? "Please enter a valid email address" : "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (fieldErrors.email || fieldErrors.phone) {
      setError("Please fix the errors in the form before submitting");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/create-staff", formData);
      setFormData({ name: "", email: "", phone: "", password: "", role: "receptionist" });
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create staff account");
    } finally {
      setSubmitting(false);
    }
  };

  const tableData = staff.map((s) => ({
    Name: s.name,
    Email: s.email,
    Phone: s.phone,
    Role: s.role.charAt(0).toUpperCase() + s.role.slice(1),
    "Joined": new Date(s.createdAt).toLocaleDateString(),
    Action: (
      <button
        onClick={() => handleDelete(s._id)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>
    ),
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Staff Users</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:opacity-90"
        >
          + Add Staff
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading staff...</p>
      ) : staff.length > 0 ? (
        <Table columns={["Name", "Email", "Phone", "Role", "Joined", "Action"]} data={tableData} />
      ) : (
        <p className="text-gray-400 text-center py-10">
          No staff accounts yet. Click "+ Add Staff" to create one.
        </p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Account">
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>
          )}

          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full border rounded px-3 py-2 mb-1 ${
              fieldErrors.email ? "border-red-400" : ""
            }`}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mb-3">{fieldErrors.email}</p>
          )}
          {!fieldErrors.email && <div className="mb-4" />}

          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            inputMode="numeric"
            placeholder="Digits only"
            className={`w-full border rounded px-3 py-2 mb-1 ${
              fieldErrors.phone ? "border-red-400" : ""
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-red-500 text-xs mb-3">{fieldErrors.phone}</p>
          )}
          {!fieldErrors.phone && <div className="mb-4" />}

          <label className="block text-sm font-medium mb-1">Temporary Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-6"
          >
            <option value="receptionist">Receptionist</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Users;