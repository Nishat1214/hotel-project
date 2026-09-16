import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Sidebar = ({ menuItems }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [pendingComplaints, setPendingComplaints] = useState(0);

  useEffect(() => {
    // Only staff (admin/receptionist) need this badge
    if (user?.role !== "admin" && user?.role !== "receptionist") return;

    const fetchCount = async () => {
      try {
        const { data } = await api.get("/complaints");
        setPendingComplaints(data.filter((c) => c.status === "Pending").length);
      } catch (err) {
        console.error("Failed to load complaint count", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // background refresh every 30 seconds

    // Instant refresh whenever a complaint is submitted, resolved, or closed anywhere in the app
    window.addEventListener("complaints-updated", fetchCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("complaints-updated", fetchCount);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-[#1E3A8A] text-white min-h-screen p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-8">🏨 GrandStay</h2>
      <nav className="flex flex-col gap-2 grow">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="px-4 py-2 rounded hover:bg-[#D4AF37] hover:text-[#1E3A8A] transition flex justify-between items-center"
          >
            <span>{item.label}</span>
            {item.label === "Complaints" && pendingComplaints > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingComplaints}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;