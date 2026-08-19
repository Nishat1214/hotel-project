// Dummy room data for now — will be replaced by backend API calls later
const rooms = [
  {
    id: 1,
    name: "Deluxe Room",
    price: 120,
    rating: 5,
    capacity: 2,
    type: "deluxe",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80",
    description:
      "A spacious and elegantly designed room offering comfort and modern amenities, perfect for couples or solo travelers.",
    facilities: ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Mini Fridge", "Breakfast Included"],
    available: true,
    status:"Available",
  },
  {
    id: 2,
    name: "Suite",
    price: 220,
    rating: 5,
    capacity: 3,
    type: "suite",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    description:
      "A luxurious suite with a separate living area, ideal for guests who want extra space and premium comfort.",
    facilities: ["Free WiFi", "Living Area", "Air Conditioning", "Mini Bar", "Room Service"],
    available: true,
    status:"Available",
  },
  {
    id: 3,
    name: "Family Room",
    price: 180,
    rating: 4,
    capacity: 4,
    type: "family",
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&q=80",
    description:
      "A comfortable room designed for families, with extra bedding space and a warm, welcoming layout.",
    facilities: ["Free WiFi", "Extra Beds", "Air Conditioning", "Flat-screen TV", "Parking"],
    available: true,
    status:"Available",
  },
  {
    id: 4,
    name: "Standard Room",
    price: 90,
    rating: 4,
    capacity: 2,
    type: "standard",
    image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=600&q=80",
    description:
      "A cozy and affordable room with all essential amenities for a pleasant stay.",
    facilities: ["Free WiFi", "Air Conditioning", "Flat-screen TV"],
    available: true,
    status:"Available",
  },
  {
    id: 5,
    name: "Executive Suite",
    price: 280,
    rating: 5,
    capacity: 2,
    type: "suite",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
    description:
      "Our top-tier suite offering panoramic views, premium furnishings, and exclusive guest privileges.",
    facilities: ["Free WiFi", "City View", "Air Conditioning", "Mini Bar", "Room Service", "Bathtub"],
    available: false,
    status:"Not Available",
  },
];

export default rooms;