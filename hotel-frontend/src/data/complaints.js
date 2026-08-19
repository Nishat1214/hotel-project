// Dummy complaint data — will come from backend later
const complaints = [
  {
    id: "C001",
    customer: "John Doe",
    room: "Deluxe Room",
    text: "The room smelled bad and the AC wasn't working.",
    category: "Room",
    priority: "High",
    department: "Maintenance",
    status: "Pending",
  },
  {
    id: "C002",
    customer: "Jane Smith",
    room: "Suite",
    text: "Housekeeping didn't clean the room this morning.",
    category: "Cleaning",
    priority: "Medium",
    department: "Housekeeping",
    status: "In Progress",
  },
  {
    id: "C003",
    customer: "Mike Ross",
    room: "Family Room",
    text: "Front desk staff was rude during check-in.",
    category: "Staff",
    priority: "Low",
    department: "Front Desk",
    status: "Resolved",
  },
];

export default complaints;