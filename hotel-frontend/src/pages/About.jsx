const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">About GrandStay Hotel</h1>

      <div className="space-y-4 text-gray-600">
        <p>
          GrandStay Hotel is committed to providing comfort, elegance, and warm hospitality
          to every guest who walks through our doors. Nestled in the heart of the city, our
          hotel offers a perfect blend of modern amenities and timeless service.
        </p>
        <p>
          From our thoughtfully designed rooms — Standard, Deluxe, Suite, and Family — to our
          on-site dining, pool, and fitness facilities, every detail is crafted with our
          guests' comfort in mind.
        </p>
        <p>
          Whether you're here for business, leisure, or a special occasion, our dedicated
          team is here to make your stay memorable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl mb-2">🏨</p>
          <p className="font-semibold text-[#1E3A8A]">Comfortable Rooms</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="font-semibold text-[#1E3A8A]">Fine Dining</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl mb-2">🤝</p>
          <p className="font-semibold text-[#1E3A8A]">Warm Hospitality</p>
        </div>
      </div>
    </div>
  );
};

export default About;