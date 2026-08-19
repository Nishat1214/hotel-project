import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Room", "Housekeeping", "Food", "Service", "Maintenance", "Billing", "General"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    department: {
      type: String,
      default: "Reception",
    },
    suggestedResolution: {
      type: String,
      default: "",
    },
    assignedDepartment: {
      type: String, // set by receptionist/admin — may differ from AI suggestion
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;