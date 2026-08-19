import { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const Billing = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");
  const [chargeError, setChargeError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payments");
      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const viewInvoice = (payment) => {
    setSelectedPayment(payment);
    setChargeAmount("");
    setChargeNote("");
    setChargeError("");
    setIsModalOpen(true);
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    setChargeError("");

    if (!chargeAmount || Number(chargeAmount) <= 0) {
      setChargeError("Please enter a valid charge amount");
      return;
    }

    try {
      const { data } = await api.put(`/payments/${selectedPayment._id}/add-charge`, {
        amount: Number(chargeAmount),
        note: chargeNote,
      });
      setSelectedPayment({ ...selectedPayment, ...data });
      setChargeAmount("");
      setChargeNote("");
      fetchPayments();
    } catch (err) {
      setChargeError(err.response?.data?.message || "Failed to add charge");
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm(`Confirm that Tk ${selectedPayment.totalAmount} has been received?`)) return;
    try {
      const { data } = await api.put(`/payments/${selectedPayment._id}/mark-paid`);
      setSelectedPayment({ ...selectedPayment, status: "Paid" });
      fetchPayments();
      alert(data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  const tableData = payments.map((p) => ({
    Invoice: p.invoiceNumber,
    Customer: p.customer?.name || "N/A",
    Room: p.reservation?.room
      ? `${p.reservation.room.type} Room ${p.reservation.room.roomNumber}`
      : "N/A",
    Total: `Tk ${p.totalAmount}`,
    Method: p.method.charAt(0).toUpperCase() + p.method.slice(1),
    Status: (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          p.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {p.status}
      </span>
    ),
    Action: (
      <button onClick={() => viewInvoice(p)} className="text-[#1E3A8A] hover:underline text-sm">
        View
      </button>
    ),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Billing</h1>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading invoices...</p>
      ) : payments.length > 0 ? (
        <Table
          columns={["Invoice", "Customer", "Room", "Total", "Method", "Status", "Action"]}
          data={tableData}
        />
      ) : (
        <p className="text-gray-400 text-center py-10">No invoices yet.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invoice Details">
        {selectedPayment && (
          <div className="space-y-2 text-sm">
            <p><strong>Invoice #:</strong> {selectedPayment.invoiceNumber}</p>
            <p><strong>Customer:</strong> {selectedPayment.customer?.name}</p>
            <p>
              <strong>Room:</strong>{" "}
              {selectedPayment.reservation?.room
                ? `${selectedPayment.reservation.room.type} Room ${selectedPayment.reservation.room.roomNumber}`
                : "N/A"}
            </p>
            <p><strong>Room Charge:</strong> Tk {selectedPayment.roomCharge}</p>
            <p><strong>Additional Charges:</strong> Tk {selectedPayment.additionalCharges}</p>
            {selectedPayment.additionalChargeNotes && (
              <p className="text-xs text-gray-500">{selectedPayment.additionalChargeNotes}</p>
            )}
            <p className="text-lg font-bold text-[#1E3A8A] pt-2 border-t">
              Total: Tk {selectedPayment.totalAmount}
            </p>
            <p><strong>Payment Method:</strong> {selectedPayment.method}</p>
            <p><strong>Status:</strong> {selectedPayment.status}</p>

            {selectedPayment.status === "Pending" && (
              <>
                <button
                  onClick={handleMarkPaid}
                  className="w-full bg-green-600 text-white py-2 rounded text-sm font-semibold hover:opacity-90 mt-3"
                >
                  Mark as Paid
                </button>

                <form onSubmit={handleAddCharge} className="bg-[#F8FAFC] rounded p-3 mt-3 space-y-2">
                  <p className="font-semibold text-[#1E3A8A]">Add Service Charge</p>
                  {chargeError && <p className="text-red-500 text-xs">{chargeError}</p>}
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount (Tk)"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Note (e.g. Minibar)"
                    value={chargeNote}
                    onChange={(e) => setChargeNote(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#1E3A8A] text-white py-2 rounded text-sm hover:opacity-90"
                  >
                    Add Charge
                  </button>
                </form>
              </>
            )}

            <button
              onClick={() => window.print()}
              className="w-full mt-4 bg-[#D4AF37] text-[#1E3A8A] py-2 rounded font-semibold hover:opacity-90"
            >
              Print Invoice
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;