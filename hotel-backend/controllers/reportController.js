import Reservation from "../models/Reservation.js";
import Payment from "../models/Payment.js";
import Room from "../models/Room.js";
import Complaint from "../models/Complaint.js";

// Helper: build a date range filter from query params
const buildDateFilter = (startDate, endDate, field = "createdAt") => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // include the whole end day
      filter[field].$lte = end;
    }
  }
  return filter;
};

// @desc   Reservation Report — totals by status within a date range
// @route  GET /api/reports/reservations?startDate=...&endDate=...
// @access Private (Admin)
export const getReservationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, "createdAt");

    const reservations = await Reservation.find(dateFilter);

    const report = {
      totalReservations: reservations.length,
      confirmed: reservations.filter((r) => r.status === "Confirmed").length,
      pending: reservations.filter((r) => r.status === "Pending").length,
      cancelled: reservations.filter((r) => r.status === "Cancelled").length,
      completed: reservations.filter((r) => r.status === "Completed").length,
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Revenue Report — totals, daily/monthly breakdown, average booking value
// @route  GET /api/reports/revenue?startDate=...&endDate=...
// @access Private (Admin)
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, "paidAt");

    const paidPayments = await Payment.find({ ...dateFilter, status: "Paid" });

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const averageBookingValue = paidPayments.length
      ? Math.round(totalRevenue / paidPayments.length)
      : 0;

    // Daily breakdown
    const dailyMap = {};
    paidPayments.forEach((p) => {
      if (!p.paidAt) return;
      const day = p.paidAt.toISOString().split("T")[0];
      dailyMap[day] = (dailyMap[day] || 0) + p.totalAmount;
    });
    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Monthly breakdown
    const monthlyMap = {};
    paidPayments.forEach((p) => {
      if (!p.paidAt) return;
      const month = p.paidAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] || 0) + p.totalAmount;
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({
      totalRevenue,
      averageBookingValue,
      totalPaidBookings: paidPayments.length,
      dailyRevenue,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Room Occupancy Report — counts + occupancy percentage
// @route  GET /api/reports/occupancy
// @access Private (Admin)
export const getOccupancyReport = async (req, res) => {
  try {
    const rooms = await Room.find();

    const total = rooms.length;
    const available = rooms.filter((r) => r.status === "Available").length;
    const reserved = rooms.filter((r) => r.status === "Reserved").length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const maintenance = rooms.filter((r) => r.status === "Maintenance").length;

    const occupancyPercentage = total
      ? Math.round(((occupied + reserved) / total) * 100)
      : 0;

    res.status(200).json({
      totalRooms: total,
      available,
      reserved,
      occupied,
      maintenance,
      occupancyPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Complaint Report — totals by status
// @route  GET /api/reports/complaints?startDate=...&endDate=...
// @access Private (Admin)
export const getComplaintReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate, "createdAt");

    const complaints = await Complaint.find(dateFilter);

    const report = {
      totalComplaints: complaints.length,
      pending: complaints.filter((c) => c.status === "Pending").length,
      inProgress: complaints.filter((c) => c.status === "In Progress").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
      closed: complaints.filter((c) => c.status === "Closed").length,
      byCategory: ["Room", "Housekeeping", "Food", "Service", "Maintenance", "Billing", "General"]
        .map((cat) => ({
          category: cat,
          count: complaints.filter((c) => c.category === cat).length,
        }))
        .filter((c) => c.count > 0),
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};