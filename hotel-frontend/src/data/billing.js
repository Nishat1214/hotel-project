// Dummy billing data — will come from backend later
const invoices = [
  {
    id: "INV001",
    bookingId: "H001",
    customer: "John Doe",
    room: "Deluxe Room",
    nights: 2,
    pricePerNight: 120,
    extraCharges: 20,
    paymentMethod: "Card",
    paid: true,
  },
  {
    id: "INV002",
    bookingId: "H003",
    customer: "Mike Ross",
    room: "Family Room",
    nights: 3,
    pricePerNight: 180,
    extraCharges: 0,
    paymentMethod: "Cash",
    paid: false,
  },
];

export default invoices;