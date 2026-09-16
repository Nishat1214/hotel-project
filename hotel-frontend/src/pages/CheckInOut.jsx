import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Table from "../components/Table";
import Modal from "../components/Modal";
import api from "../services/api";

const CheckInOut = () => {
  const { user } = useAuth();
  const basePath = user?.role === "admin" ? "/admin" : "/receptionist";

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("checkin");

  const [checkinModal, setCheckinModal] = useState(null);
  const [checkinError, setCheckinError] = useState("");

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [additionalCharge, setAdditionalCharge] = useState("");
  const [chargeNote, setChargeNote] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [finalPaymentConfirmed, setFinalPaymentConfirmed] = useState(false);
  const [balanceMethod, setBalanceMethod] = useState("cash");
  const [step, setStep] = useState("charges");

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reservations");
      setReservations(data);
    } catch (err) {
      console.error("Failed to load reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const openCheckinModal = (reservation) => {
    setCheckinModal(reservation);
    setCheckinError("");
  };

  const handleCheckinSubmit = async () => {
    setCheckinError("");
    try {
      const { data } = await api.put(`/reservations/${checkinModal._id}/checkin`);
      alert(data.message);
      setCheckinModal(null);
      fetchReservations();
    } catch (err) {
      setCheckinError(err.response?.data?.message || "Check-in failed");
    }
  };

  const openCheckoutModal = async (reservation) => {
    setCheckoutModal(reservation);
    setAdditionalCharge("");
    setChargeNote("");
    setCheckoutError("");
    setFinalPaymentConfirmed(false);
    setBalanceMethod("cash");
    setStep("charges");
    setBillPreview(null);

    try {
      const { data } = await api.get(`/reservations/${reservation._id}/checkout-preview`);
      setBillPreview(data);
    } catch (err) {
      setCheckoutError("Failed to load bill preview");
    }
  };

  const handleGenerateBill = () => {
    setStep("confirm");
  };

  const handleFinalizeCheckout = async () => {
    setCheckoutError("");

    const finalBalance =
      billPreview.balanceAmount +
      (Number(additionalCharge) || 0) +
      (billPreview.daysLate > 0 ? billPreview.lateFee : 0);

    try {
      const { data } = await api.put(`/reservations/${checkoutModal._id}/checkout`, {
        additionalCharge: additionalCharge || 0,
        note: chargeNote,
        balanceMethod: finalBalance > 0 ? balanceMethod : undefined,
      });
      alert(data.message);
      setCheckoutModal(null);
      fetchReservations();
    } catch (err) {
      setCheckoutError(err.response?.data?.message || "Check-out failed");
    }
  };

  const readyForCheckIn = reservations.filter((r) => r.status === "Confirmed" && !r.checkedIn);
  const readyForCheckOut = reservations.filter(
    (r) => r.checkedIn && r.status !== "Completed" && r.status !== "Cancelled"
  );

  const checkInTableData = readyForCheckIn.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-in Date": new Date(r.checkIn).toLocaleDateString(),
    "Payment Status": r.paymentStatus,
    Action: (
      <button
        onClick={() => openCheckinModal(r)}
        className="bg-[#1E3A8A] text-white px-3 py-1 rounded text-xs hover:opacity-90"
      >
        Check In
      </button>
    ),
  }));

  const checkOutTableData = readyForCheckOut.map((r) => ({
    "Booking ID": r._id.slice(-6).toUpperCase(),
    Customer: r.customer?.name || "N/A",
    Room: r.room ? `${r.room.type} Room ${r.room.roomNumber}` : "N/A",
    "Check-out Date": new Date(r.checkOut).toLocaleDateString(),
    "Checked In": r.actualCheckIn ? new Date(r.actualCheckIn).toLocaleString() : "N/A",
    Action: (
      <button
        onClick={() => openCheckoutModal(r)}
        className="bg-[#D4AF37] text-[#1E3A8A] px-3 py-1 rounded text-xs font-semibold hover:opacity-90"
      >
        Check Out
      </button>
    ),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">Check-in / Check-out</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("checkin")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "checkin" ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Ready for Check-in ({readyForCheckIn.length})
        </button>
        <button
          onClick={() => setActiveTab("checkout")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "checkout" ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Ready for Check-out ({readyForCheckOut.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : activeTab === "checkin" ? (
        checkInTableData.length > 0 ? (
          <Table
            columns={["Booking ID", "Customer", "Room", "Check-in Date", "Payment Status", "Action"]}
            data={checkInTableData}
          />
        ) : (
          <p className="text-gray-400 text-center py-10">No guests ready for check-in.</p>
        )
      ) : checkOutTableData.length > 0 ? (
        <Table
          columns={["Booking ID", "Customer", "Room", "Check-out Date", "Checked In", "Action"]}
          data={checkOutTableData}
        />
      ) : (
        <p className="text-gray-400 text-center py-10">No guests ready for check-out.</p>
      )}

      {/* CHECK-IN MODAL */}
      <Modal isOpen={!!checkinModal} onClose={() => setCheckinModal(null)} title="Confirm Check-in">
        {checkinModal && (
          <div>
            {checkinError && (
              <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{checkinError}</p>
            )}

            <p className="text-sm mb-1">
              <strong>Guest:</strong> {checkinModal.customer?.name}
            </p>
            <p className="text-sm mb-1">
              <strong>Room:</strong> {checkinModal.room?.type} Room {checkinModal.room?.roomNumber}
            </p>
            <p className="text-sm mb-4">
              <strong>Total Amount:</strong> Tk {checkinModal.totalPrice}
            </p>

            {checkinModal.paymentStatus === "Paid" ? (
              <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4">
                ✅ Bill fully paid. Ready to check in.
              </p>
            ) : (
              <p className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
                ⚠️ Balance of Tk {checkinModal.balanceAmount} is unpaid. Please settle the bill in
                Billing before checking in this guest.
              </p>
            )}

            <button
              onClick={handleCheckinSubmit}
              disabled={checkinModal.paymentStatus !== "Paid"}
              className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check In Guest
            </button>

            {checkinModal.paymentStatus !== "Paid" && (
              <Link
                to={`${basePath}/billing`}
                className="block text-center text-[#1E3A8A] text-sm font-semibold hover:underline mt-3"
              >
                Go to Billing →
              </Link>
            )}
          </div>
        )}
      </Modal>

      {/* CHECK-OUT MODAL */}
      <Modal
        isOpen={!!checkoutModal}
        onClose={() => setCheckoutModal(null)}
        title={step === "charges" ? "Generate Final Bill" : "Confirm Check-out"}
      >
        {checkoutModal && billPreview && (
          <div>
            {checkoutError && (
              <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{checkoutError}</p>
            )}

            <p className="text-sm mb-3">
              <strong>Guest:</strong> {checkoutModal.customer?.name} — {billPreview.room?.type} Room{" "}
              {billPreview.room?.roomNumber}
            </p>

            {step === "charges" ? (
              <>
                <div className="bg-[#F8FAFC] rounded p-3 mb-4 text-sm space-y-1">
                  <p>Room charge: Tk {billPreview.roomCharge}</p>
                  <p>Advance paid: Tk {billPreview.advanceAmount} ({billPreview.advanceMethod})</p>
                  {billPreview.balancePaid ? (
                    <p className="text-green-600 font-medium">✅ Balance already settled</p>
                  ) : (
                    <p>Balance so far: Tk {billPreview.balanceAmount}</p>
                  )}
                  {billPreview.daysLate > 0 && (
                    <p className="text-red-600 font-medium pt-1 border-t mt-1">
                      ⚠️ {billPreview.daysLate} day{billPreview.daysLate > 1 ? "s" : ""} late — Tk{" "}
                      {billPreview.lateFee} late checkout fee will be added automatically
                    </p>
                  )}
                </div>

                <label className="block text-sm font-medium mb-1">
                  Additional Charges (Tk) — optional
                </label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border rounded px-3 py-2 mb-3"
                />

                <label className="block text-sm font-medium mb-1">Note</label>
                <input
                  type="text"
                  value={chargeNote}
                  onChange={(e) => setChargeNote(e.target.value)}
                  placeholder="e.g. Minibar, room damage"
                  className="w-full border rounded px-3 py-2 mb-4"
                />

                <button
                  onClick={handleGenerateBill}
                  className="w-full bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90"
                >
                  Generate Final Bill
                </button>
              </>
            ) : (
              <>
                <div className="bg-[#F8FAFC] rounded p-4 mb-4 text-sm space-y-1">
                  <p className="font-semibold text-[#1E3A8A] mb-2">📄 Final Invoice</p>
                  <p>Room charge: Tk {billPreview.roomCharge}</p>
                  <p>
                    Additional charges: Tk{" "}
                    {billPreview.additionalCharges +
                      (Number(additionalCharge) || 0) +
                      (billPreview.daysLate > 0 ? billPreview.lateFee : 0)}
                  </p>
                  {Number(additionalCharge) > 0 && (
                    <p className="text-gray-500 text-xs">
                      (includes Tk {Number(additionalCharge)} manual charge)
                    </p>
                  )}
                  {billPreview.daysLate > 0 && (
                    <p className="text-red-600 text-xs">
                      (includes Tk {billPreview.lateFee} late checkout fee for {billPreview.daysLate} extra day
                      {billPreview.daysLate > 1 ? "s" : ""})
                    </p>
                  )}
                  <p>Advance already paid: Tk {billPreview.advanceAmount}</p>
                  <p className="font-bold text-lg pt-2 border-t mt-2">
                    Balance Due Now: Tk{" "}
                    {billPreview.balanceAmount +
                      (Number(additionalCharge) || 0) +
                      (billPreview.daysLate > 0 ? billPreview.lateFee : 0)}
                  </p>
                </div>

                {(() => {
                  const finalBalance =
                    billPreview.balanceAmount +
                    (Number(additionalCharge) || 0) +
                    (billPreview.daysLate > 0 ? billPreview.lateFee : 0);

                  return finalBalance > 0 ? (
                    <>
                      <label className="block text-sm font-medium mb-1">Balance Payment Method</label>
                      <select
                        value={balanceMethod}
                        onChange={(e) => setBalanceMethod(e.target.value)}
                        className="w-full border rounded px-3 py-2 mb-3"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>

                      <label className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-sm px-3 py-3 rounded mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={finalPaymentConfirmed}
                          onChange={(e) => setFinalPaymentConfirmed(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          I confirm the balance of Tk {finalBalance} has been received via {balanceMethod}.
                        </span>
                      </label>
                    </>
                  ) : (
                    <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-4">
                      ✅ No outstanding balance — ready to complete check-out.
                    </p>
                  );
                })()}

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("charges")}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalizeCheckout}
                    disabled={
                      billPreview.balanceAmount +
                        (Number(additionalCharge) || 0) +
                        (billPreview.daysLate > 0 ? billPreview.lateFee : 0) >
                        0 && !finalPaymentConfirmed
                    }
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Complete Check-out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CheckInOut;