import Complaint from "../models/Complaint.js";
import { analyzeComplaint } from "../utils/aiComplaintAnalyzer.js";
import Reservation from "../models/Reservation.js";
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
      status: { $in: ["Confirmed"] }, // still an active stay (not yet Completed/Cancelled)
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
      .populate("reservation", "room checkIn checkOut")
      .sort({ createdAt: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Receptionist/Admin assigns the complaint to a department and/or updates status
// @route  PUT /api/complaints/:id
// @access Private (Admin, Receptionist)
export const updateComplaint = async (req, res) => {
  try {
    const { status, assignedDepartment } = req.body;

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

    if (assignedDepartment) {
      complaint.assignedDepartment = assignedDepartment;
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