import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: only allow digits to actually be entered
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData({ ...formData, phone: digitsOnly });

      setFieldErrors((prev) => ({
        ...prev,
        phone: digitsOnly.length > 0 && digitsOnly.length < 10 ? "Phone number seems too short" : "",
      }));
      return;
    }

    setFormData({ ...formData, [name]: value });

    // Email: validate format live
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setFieldErrors((prev) => ({
        ...prev,
        email: value.length > 0 && !emailRegex.test(value) ? "Please enter a valid email address" : "",
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (fieldErrors.email || fieldErrors.phone) {
      setError("Please fix the errors in the form before submitting");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (fieldErrors.email || fieldErrors.phone) {
      setError("Please fix the errors in the form before submitting");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      login(
        { id: data._id, name: data.name, email: data.email, role: data.role },
        data.token
      );

      navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1E3A8A]">
          Create an Account
        </h2>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</p>
        )}

        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-4"
        />

       <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`w-full border rounded px-3 py-2 mb-1 ${
            fieldErrors.email ? "border-red-400" : ""
          }`}
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mb-3">{fieldErrors.email}</p>
        )}
        {!fieldErrors.email && <div className="mb-4" />}
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className={`w-full border rounded px-3 py-2 mb-1 ${
            fieldErrors.phone ? "border-red-400" : ""
          }`}
        />
        {fieldErrors.phone && (
          <p className="text-red-500 text-xs mb-3">{fieldErrors.phone}</p>
        )}
        {!fieldErrors.phone && <div className="mb-4" />}

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <label className="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1E3A8A] font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;