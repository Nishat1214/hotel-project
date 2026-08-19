import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // your backend URL (we'll build this later)
  headers: { "Content-Type": "application/json" },
});

// Automatically attach the login token to every request, if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;