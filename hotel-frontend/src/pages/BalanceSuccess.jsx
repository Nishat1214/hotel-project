import { useSearchParams, Link } from "react-router-dom";

const BalanceSuccess = () => {
  const [searchParams] = useSearchParams();
  const checkoutCompleted = searchParams.get("checkout") === "true";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">
          {checkoutCompleted ? "Payment & Check-out Complete!" : "Balance Settled!"}
        </h1>
        <p className="text-gray-500 mb-6">
          {checkoutCompleted
            ? "The remaining balance was paid and the guest has been checked out."
            : "The remaining balance has been paid in full."}
        </p>
        <Link
          to={checkoutCompleted ? "/receptionist/checkin" : "/receptionist/billing"}
          className="inline-block bg-[#1E3A8A] text-white px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          {checkoutCompleted ? "Back to Check-in/out" : "Back to Billing"}
        </Link>
      </div>
    </div>
  );
};

export default BalanceSuccess;