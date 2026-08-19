import { Link } from "react-router-dom";

const Hero = () => {
  return (
      <div className="relative h-[70vh] flex items-center justify-center text-center text-white bg-cover bg-center" 
      style={{ backgroundImage: "linear-gradient(rgba(30,58,138,0.7), rgba(30,58,138,0.7)), url('https://images.unsplash.com/photo-1742171046853-0961eabdc7d4?w=1600&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHJlc29ydCUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D')", }} 
      >
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Experience Comfort Like Never Before
        </h1>
        <p className="text-lg mb-6 text-gray-200">
          Book your perfect stay with us today
        </p>
        <Link
          to="/rooms"
          className="bg-[#D4AF37] text-[#1E3A8A] px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
};

export default Hero;