import Room from "../models/Room.js";

// Business rule: max capacity allowed per room type
const CAPACITY_LIMITS = {
  standard: 3,
  deluxe: 2,
  suite: 2,
  family: 4,
};

const isValidCapacity = (type, capacity) => {
  const limit = CAPACITY_LIMITS[type];
  return limit !== undefined && capacity <= limit && capacity >= 1;
};

// @desc   Admin adds a new room
// @route  POST /api/rooms
// @access Private (Admin only)
export const addRoom = async (req, res) => {
  try {
   
    const { roomNumber, type, capacity, price, facilities, images, status } = req.body;

    if (!roomNumber || !type || !capacity || price === undefined) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    if (!isValidCapacity(type, capacity)) {
      return res.status(400).json({
        message: `Capacity for ${type} rooms cannot exceed ${CAPACITY_LIMITS[type]} guests`,
      });
    }

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const room = await Room.create({
      roomNumber,
      type,
      capacity,
      price,
      facilities,
      images,
      status: status || "Available",
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get all rooms — supports search + filter by type/status
// @route  GET /api/rooms?type=deluxe&status=Available&search=101
// @access Public
export const getAllRooms = async (req, res) => {
  try {
    const { type, status, search } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (search) {
      filter.roomNumber = { $regex: search, $options: "i" };
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get a single room by ID
// @route  GET /api/rooms/:id
// @access Public
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Admin updates a room
// @route  PUT /api/rooms/:id
// @access Private (Admin only)
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const { price, capacity, type } = req.body;

    if (price !== undefined && price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    const effectiveType = type || room.type;
    const effectiveCapacity = capacity !== undefined ? capacity : room.capacity;

    if (!isValidCapacity(effectiveType, effectiveCapacity)) {
      return res.status(400).json({
        message: `Capacity for ${effectiveType} rooms cannot exceed ${CAPACITY_LIMITS[effectiveType]} guests`,
      });
    }

    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const clash = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (clash) {
        return res.status(400).json({ message: "Room number already exists" });
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Admin deletes a room
// @route  DELETE /api/rooms/:id
// @access Private (Admin only)
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status === "Occupied" || room.status === "Reserved") {
      return res.status(400).json({
        message: "Cannot delete a room that is currently occupied or reserved",
      });
    }

    await room.deleteOne();

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get rooms grouped by category (type) with availability summary
// @route  GET /api/rooms/categories
// @access Public
export const getRoomCategories = async (req, res) => {
  try {
    const types = ["standard", "deluxe", "suite", "family"];

    const categories = await Promise.all(
      types.map(async (type) => {
        const rooms = await Room.find({ type });
        const availableRooms = rooms.filter((r) => r.status === "Available");
        const prices = rooms.map((r) => r.price);
        const facilitiesSet = new Set(rooms.flatMap((r) => r.facilities || []));

        return {
          type,
          totalRooms: rooms.length,
          availableCount: availableRooms.length,
          minPrice: prices.length ? Math.min(...prices) : null,
          capacity: CAPACITY_LIMITS[type],
          image: rooms.find((r) => r.images?.length)?.images[0] || null,
          facilities: Array.from(facilitiesSet),
        };
      })
    );

    // Only show categories that actually have at least one room created
    res.status(200).json(categories.filter((c) => c.totalRooms > 0));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};