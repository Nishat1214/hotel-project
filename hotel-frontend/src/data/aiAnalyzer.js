// TEMPORARY rule-based simulation of the AI complaint analyzer.
// Later, this will call your backend, which calls a real AI model.
export const analyzeComplaint = (text) => {
  const lower = text.toLowerCase();

  let category = "General";
  let department = "Front Desk";
  if (lower.includes("ac") || lower.includes("smell") || lower.includes("broken") || lower.includes("leak")) {
    category = "Room";
    department = "Maintenance";
  } else if (lower.includes("clean") || lower.includes("dirty") || lower.includes("housekeeping")) {
    category = "Cleaning";
    department = "Housekeeping";
  } else if (lower.includes("staff") || lower.includes("rude") || lower.includes("service")) {
    category = "Staff";
    department = "Front Desk";
  } else if (lower.includes("bill") || lower.includes("charge") || lower.includes("payment")) {
    category = "Billing";
    department = "Accounts";
  }

  let priority = "Low";
  if (lower.includes("not working") || lower.includes("broken") || lower.includes("urgent") || lower.includes("bad")) {
    priority = "High";
  } else if (lower.includes("late") || lower.includes("delay")) {
    priority = "Medium";
  }

  return { category, priority, department };
};