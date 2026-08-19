import { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const CAPACITY_LIMITS = {
  standard: 3,
  deluxe: 2,
  suite: 2,
  family: 4,
};
const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    type: "standard",
    capacity: 2,
    price: "",
    status: "Available",
  });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rooms");
      setRooms(data);
    } catch (err) {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: "",
      type: "standard",
      capacity: 2,
      price: "",
      status: "Available",
      facilities: "",
      images: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity,
      price: room.price,
      status: room.status,
       facilities: room.facilities?.join(", ") || "",
      images: room.images?.join(", ") || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

   const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const capacityLimit = CAPACITY_LIMITS[formData.type];
    if (Number(formData.capacity) > capacityLimit) {
      setError(`Capacity for ${formData.type} rooms cannot exceed ${capacityLimit} guests`);
      return;
    }

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        price: Number(formData.price),
        facilities: formData.facilities
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f.length > 0),
        images: formData.images
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img.length > 0),
      };

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, payload);
      } else {
        await api.post("/rooms", payload);
      }

      setIsModalOpen(false);
      fetchRooms(); // refresh list
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete room");
    }
  };

  const tableData = rooms.map((room) => ({
    "Room No": room.roomNumber,
    Type: room.type,
    Price: `৳${room.price}`,
    Status: room.status,
    Action: (
      <div className="flex gap-2">
        <button onClick={() => openEditModal(room)} className="text-[#1E3A8A] hover:underline text-sm">
          Edit
        </button>
        <button onClick={() => handleDelete(room._id)} className="text-red-600 hover:underline text-sm">
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Room Management</h1>
        <button
          onClick={openAddModal}
          className="bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:opacity-90"
        >
          + Add Room
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading rooms...</p>
      ) : (
        <Table columns={["Room No", "Type", "Price", "Status", "Action"]} data={tableData} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? "Edit Room" : "Add Room"}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>
          )}

          <label className="block text-sm font-medium mb-1">Room Number</label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          >
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="family">Family</option>
          </select>

          <label className="block text-sm font-medium mb-1">
            Capacity (max {CAPACITY_LIMITS[formData.type]} for {formData.type})
          </label>
          <input
            type="number"
            name="capacity"
            min="1"
            max={CAPACITY_LIMITS[formData.type]}
            value={formData.capacity}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block text-sm font-medium mb-1">Price per Night</label>
          <input
            type="number"
            name="price"
            min="0.01"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mb-4"
          />
          <label className="block text-sm font-medium mb-1">
            Facilities (comma-separated)
          </label>
          <input
            type="text"
            name="facilities"
            value={formData.facilities}
            onChange={handleChange}
            placeholder="e.g. WiFi, AC, TV, Breakfast"
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <label className="block text-sm font-medium mb-1">
            Image URL(s) (comma-separated)
          </label>
          <input
            type="text"
            name="images"
            value={formData.images}
            onChange={handleChange}
            placeholder="https://example.com/room-photo.jpg"
            className="w-full border rounded px-3 py-2 mb-4"
          />
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-6"
          >
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <button
            type="submit"
            className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90"
          >
            {editingRoom ? "Update Room" : "Add Room"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default RoomManagement;