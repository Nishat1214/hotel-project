import { useSearchParams, Link } from "react-router-dom";

const BookingFail = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-6">
          {reason || "Your payment could not be completed. No amount was charged."}
        </p>
        <Link
          to="/rooms"
          className="inline-block bg-[#1E3A8A] text-white px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
};

export default BookingFail;