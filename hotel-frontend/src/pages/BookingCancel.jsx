import { Link } from "react-router-dom";

const BookingCancel = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-6">You cancelled the payment. No amount was charged.</p>
        <Link
          to="/rooms"
          className="inline-block bg-[#1E3A8A] text-white px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          Back to Rooms
        </Link>
      </div>
    </div>
  );
};

export default BookingCancel;