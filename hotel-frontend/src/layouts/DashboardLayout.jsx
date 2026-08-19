import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const DashboardLayout = ({ menuItems, title }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar menuItems={menuItems} />
      <div className="flex flex-col grow">
        <Header title={title} />
        <main className="grow p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;