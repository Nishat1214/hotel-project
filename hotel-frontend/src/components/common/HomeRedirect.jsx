import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Home from "../../pages/Home";

// If a user is logged in, send them to their dashboard instead of the public homepage.
// Guests (not logged in) see the normal public Home page.
const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Home />;

  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "receptionist") return <Navigate to="/receptionist" replace />;
  if (user.role === "customer") return <Navigate to="/customer" replace />;

  return <Home />;
};

export default HomeRedirect;