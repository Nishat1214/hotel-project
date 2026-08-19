import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Not logged in at all -> send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but wrong role for this page -> send to login page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Logged in and correct role -> show the page
  return children;
};

export default ProtectedRoute;