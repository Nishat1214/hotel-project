import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
   const [loginRole, setLoginRole] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      login(
        { id: data._id, name: data.name, email: data.email, role: data.role },
        data.token
      );

      setLoginRole(data.role);

      // Brief confirmation before redirecting
      setTimeout(() => {
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "receptionist") navigate("/receptionist");
        else navigate("/customer");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1E3A8A]">Login</h2>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>
        )}

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <p className="text-right text-sm mb-4">
          <Link to="/forgot-password" className="text-[#1E3A8A] hover:underline">
            Forgot password?
          </Link>
        </p>
        
        {loginRole && (
          <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4 text-center font-medium">
            ✅ Logged in as {loginRole.charAt(0).toUpperCase() + loginRole.slice(1)} — redirecting...
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#1E3A8A] font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;