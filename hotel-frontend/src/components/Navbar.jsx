import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `hover:text-[#D4AF37] transition ${isActive ? "text-[#D4AF37] font-semibold" : ""}`;

  return (
    <nav className="bg-[#1E3A8A] text-white px-6 py-4">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          🏨 GrandStay Hotel
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/rooms" className={navLinkClass}>Rooms</NavLink>
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          <Link
            to="/login"
            className="bg-[#D4AF37] text-[#1E3A8A] px-4 py-2 rounded font-semibold hover:opacity-90"
          >
            Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 pb-2">
          <NavLink to="/" className={navLinkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/rooms" className={navLinkClass} onClick={() => setMenuOpen(false)}>Rooms</NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass} onClick={() => setMenuOpen(false)}>Contact</NavLink>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="bg-[#D4AF37] text-[#1E3A8A] px-4 py-2 rounded font-semibold text-center"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;