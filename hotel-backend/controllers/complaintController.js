import Complaint from "../models/Complaint.js";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import sendEmail from "../utils/sendEmail.js";
import { analyzeComplaint } from "../utils/aiComplaintAnalyzer.js";

// @desc   Customer submits a complaint (stored as Pending, then AI analyzes it)
// @route  POST /api/complaints
// @access Private (Customer)
export const submitComplaint = async (req, res) => {
  try {
    const { description, reservationId } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: "Complaint description is required" });
    }

    // Business rule: customer must currently be checked in at the hotel to submit a complaint
    const activeStay = await Reservation.findOne({
      customer: req.user._id,
      checkedIn: true,
      status: { $in: ["Confirmed"] },
    });

    if (!activeStay) {
      return res.status(403).json({
        message: "You can only submit a complaint while checked in at the hotel.",
      });
    }

    // Step 2: store with initial status Pending
    const complaint = await Complaint.create({
      customer: req.user._id,
      reservation: reservationId || activeStay._id,
      description,
      status: "Pending",
    });

    // Step 3-5: send to AI, then store the analysis on the complaint
    const { category, priority, department, suggestedResolution } = await analyzeComplaint(description);

    complaint.category = category;
    complaint.priority = priority;
    complaint.department = department;
    complaint.suggestedResolution = suggestedResolution;
    await complaint.save();

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get complaints (Admin/Receptionist see all, Customer sees only their own)
// @route  GET /api/complaints
// @access Private
export const getComplaints = async (req, res) => {
  try {
    const filter = req.user.role === "customer" ? { customer: req.user._id } : {};

    const complaints = await Complaint.find(filter)
      .populate("customer", "name email")
      .populate({
        path: "reservation",
        select: "room checkIn checkOut status checkedIn",
        populate: { path: "room", select: "type roomNumber" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Receptionist/Admin assigns the complaint to department(s) and/or updates status
// @route  PUT /api/complaints/:id
// @access Private (Admin, Receptionist)
export const updateComplaint = async (req, res) => {
  try {
    const { status, assignedDepartments } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (status) {
      const validStatuses = ["Pending", "In Progress", "Resolved", "Closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      complaint.status = status;
    }

    if (Array.isArray(assignedDepartments)) {
      complaint.assignedDepartments = assignedDepartments;
    }

    await complaint.save();

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Close a complaint
// @route  PUT /api/complaints/:id/close
// @access Private (Admin, Receptionist)
export const closeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = "Closed";
    await complaint.save();

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Change the guest's room as a complaint resolution (e.g. unfixable AC issue)
// @route  PUT /api/complaints/:id/change-room
// @access Private (Admin, Receptionist)
export const changeRoomForComplaint = async (req, res) => {
  try {
    const { newRoomId } = req.body;
    if (!newRoomId) {
      return res.status(400).json({ message: "newRoomId is required" });
    }

    const complaint = await Complaint.findById(req.params.id).populate("customer", "name email");
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (!complaint.reservation) {
      return res.status(400).json({ message: "This complaint has no linked reservation to change a room for" });
    }

    const reservation = await Reservation.findById(complaint.reservation);
    if (!reservation) {
      return res.status(404).json({ message: "Linked reservation not found" });
    }

    if (reservation.status === "Cancelled" || reservation.status === "Completed") {
      return res.status(400).json({ message: "Cannot change room for a cancelled or completed reservation" });
    }

    const oldRoom = await Room.findById(reservation.room);
    const newRoom = await Room.findById(newRoomId);
    if (!newRoom) {
      return res.status(404).json({ message: "New room not found" });
    }

    if (newRoom._id.toString() === reservation.room.toString()) {
      return res.status(400).json({ message: "This is already the guest's current room" });
    }

    if (newRoom.status === "Maintenance") {
      return res.status(400).json({ message: "Selected room is under maintenance" });
    }

    if (reservation.guests > newRoom.capacity) {
      return res.status(400).json({
        message: `Selected room only accommodates up to ${newRoom.capacity} guests`,
      });
    }

    // Ensure no overlap with the reservation's dates (excluding the current reservation itself)
    const overlap = await Reservation.findOne({
      room: newRoomId,
      _id: { $ne: reservation._id },
      status: { $ne: "Cancelled" },
      checkIn: { $lt: reservation.checkOut },
      checkOut: { $gt: reservation.checkIn },
    });
    if (overlap) {
      return res.status(400).json({ message: "Selected room is not available for these dates" });
    }

    // Swap rooms
    reservation.room = newRoomId;
    await reservation.save();

    if (oldRoom) {
      oldRoom.status = "Available";
      await oldRoom.save();
    }
    newRoom.status = reservation.checkedIn ? "Occupied" : "Reserved";
    await newRoom.save();

    complaint.status = "Resolved";
    complaint.suggestedResolution = `${complaint.suggestedResolution || ""} — Resolved by moving guest to ${newRoom.type} Room ${newRoom.roomNumber}.`.trim();
    await complaint.save();

    try {
      await sendEmail({
        to: complaint.customer.email,
        subject: "Room Change - GrandStay Hotel",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
            <h2 style="color: #1E3A8A;">Your Room Has Been Changed</h2>
            <p>Hi ${complaint.customer.name},</p>
            <p>Regarding your recent complaint, we've moved you to a new room:</p>
            <p><strong>New Room:</strong> ${newRoom.type.charAt(0).toUpperCase() + newRoom.type.slice(1)} Room ${newRoom.roomNumber}</p>
            <p>We apologize for the inconvenience and appreciate your patience.</p>
            <p style="color:#888; font-size:12px;">GrandStay Hotel</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("❌ Failed to send room change email:", emailErr.message);
    }

    res.status(200).json({ message: `Guest moved to ${newRoom.type} Room ${newRoom.roomNumber}`, complaint, reservation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};