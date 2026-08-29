import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

import Home from "../pages/Home";
import Rooms from "../pages/Rooms";
import RoomDetails from "../pages/RoomDetails";
import Login from "../pages/Login";
import Register from "../pages/Register";
import CustomerDashboard from "../pages/CustomerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ReceptionDashboard from "../pages/ReceptionDashboard";
import RoomManagement from "../pages/RoomManagement";
import ReservationManagement from "../pages/ReservationManagement";
import CheckInOut from "../pages/CheckInOut";
import ReceptionReservations from "../pages/ReceptionReservations";
import Billing from "../pages/Billing";
import ComplaintManagement from "../pages/ComplaintManagement";
import SubmitComplaint from "../pages/SubmitComplaint";
import MyReservations from "../pages/MyReservations";
import Reports from "../pages/Reports";
import Users from "../pages/Users";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import RoomCategoryDetails from "../pages/RoomCategoryDetails";
import BookingSuccess from "../pages/BookingSuccess";
import BookingFail from "../pages/BookingFail";
import BookingCancel from "../pages/BookingCancel";
import WalkInBooking from "../pages/WalkInBooking";
import WriteReview from "../pages/WriteReview";
import BalanceSuccess from "../pages/BalanceSuccess";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Customers from "../pages/Customers";
import HomeRedirect from "../components/common/HomeRedirect";

// Sidebar menus for each role
const customerMenu = [
  { label: "Dashboard", path: "/customer" },
  { label: "My Reservations", path: "/customer/reservations" },
  { label: "Complaints", path: "/customer/complaints" },
  { label: "Write a Review", path: "/customer/review" },
];

const adminMenu = [
  { label: "Dashboard", path: "/admin" },
  { label: "Rooms", path: "/admin/rooms" },
  { label: "Reservations", path: "/admin/reservations" },
  { label: "Users", path: "/admin/users" },
  { label: "Customers", path: "/admin/customers" },
  { label: "Complaints", path: "/admin/complaints" },
  { label: "Reports", path: "/admin/reports" },
];

const receptionMenu = [
  { label: "Dashboard", path: "/receptionist" },
  { label: "New Booking", path: "/receptionist/walkin" },
  { label: "Reservations", path: "/receptionist/reservations" },
  { label: "Check-in", path: "/receptionist/checkin" },
  { label: "Billing", path: "/receptionist/billing" },
  { label: "Complaints", path: "/receptionist/complaints" },
];

function AppRoutes() {
  return (
    <Routes>
      {/* Public site with Navbar + Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/rooms/category/:type" element={<RoomCategoryDetails />} />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/booking/fail" element={<BookingFail />} />
        <Route path="/booking/cancel" element={<BookingCancel />} />
        <Route path="/payment/balance-success" element={<BalanceSuccess />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Customer dashboard */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <DashboardLayout menuItems={customerMenu} title="Customer Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/reservations" element={<MyReservations />} />
        <Route path="/customer/complaints" element={<SubmitComplaint />} />
        <Route path="/customer/review" element={<WriteReview />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout menuItems={adminMenu} title="Admin Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/rooms" element={<RoomManagement />} />
        <Route path="/admin/reservations" element={<ReservationManagement />} />
        <Route path="/admin/complaints" element={<ComplaintManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/customers" element={<Customers />} />
      </Route>

      {/* Receptionist dashboard */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["receptionist"]}>
            <DashboardLayout menuItems={receptionMenu} title="Receptionist Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route path="/receptionist" element={<ReceptionDashboard />} />
        <Route path="/receptionist/reservations" element={<ReceptionReservations />} />
        <Route path="/receptionist/checkin" element={<CheckInOut />} />
        <Route path="/receptionist/billing" element={<Billing />} />
        <Route path="/receptionist/complaints" element={<ComplaintManagement />} />
        <Route path="/receptionist/walkin" element={<WalkInBooking />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;