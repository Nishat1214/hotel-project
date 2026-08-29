import { useState, useEffect } from "react";
import Table from "../components/Table";
import api from "../services/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/auth/customers");
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const tableData = filtered.map((c) => ({
    Name: c.name,
    Email: c.email,
    Phone: c.phone,
    Joined: new Date(c.createdAt).toLocaleDateString(),
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Customers</h1>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading customers...</p>
      ) : filtered.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
          </p>
          <Table columns={["Name", "Email", "Phone", "Joined"]} data={tableData} />
        </>
      ) : (
        <p className="text-gray-400 text-center py-10">
          {search ? "No customers match your search." : "No customers registered yet."}
        </p>
      )}
    </div>
  );
};

export default Customers;