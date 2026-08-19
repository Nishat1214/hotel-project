import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ menuItems }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
            className="px-4 py-2 rounded hover:bg-[#D4AF37] hover:text-[#1E3A8A] transition"
          >
            {item.label}
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