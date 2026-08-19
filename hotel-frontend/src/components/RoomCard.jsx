import { Link } from "react-router-dom";

const RoomCard = ({ room }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-bold text-[#1E3A8A]">{room.name}</h3>
        <p className="text-[#D4AF37] font-semibold">${room.price} / Night</p>
        <p className="text-yellow-500 text-sm mb-2">
          {"⭐".repeat(room.rating)}
        </p>
        <p className="text-gray-500 text-sm mb-3">Capacity: {room.capacity} guests</p>
        <Link
          to={`/rooms/${room.id}`}
          className="block text-center bg-[#1E3A8A] text-white py-2 rounded hover:opacity-90"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RoomCard;