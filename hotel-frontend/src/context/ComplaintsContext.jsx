import { createContext, useContext, useState } from "react";
import complaintsData from "../data/complaints";
import { analyzeComplaint } from "../data/aiAnalyzer";

const ComplaintsContext = createContext();

export const ComplaintsProvider = ({ children }) => {
  const [complaints, setComplaints] = useState(complaintsData);

  // Called when a customer submits a new complaint
  const addComplaint = (text, customer, room) => {
    const aiResult = analyzeComplaint(text);
    const newComplaint = {
      id: `C${String(complaints.length + 1).padStart(3, "0")}`,
      customer,
      room,
      text,
      ...aiResult, // category, priority, department
      status: "Pending",
    };
    setComplaints((prev) => [newComplaint, ...prev]); // newest first
    return newComplaint;
  };

  // Called from Admin/Receptionist side to update status
  const updateComplaintStatus = (id, status) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <ComplaintsContext.Provider value={{ complaints, addComplaint, updateComplaintStatus }}>
      {children}
    </ComplaintsContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintsContext);