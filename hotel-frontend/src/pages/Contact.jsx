import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend endpoint for this yet — just a friendly acknowledgment for now
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6 text-center">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h3 className="font-semibold text-[#1E3A8A] mb-3">Get in Touch</h3>
          <p className="text-gray-600 text-sm mb-2">📍 123 GrandStay Avenue, Dhaka, Bangladesh</p>
          <p className="text-gray-600 text-sm mb-2">📞 +880 1700-000000</p>
          <p className="text-gray-600 text-sm mb-2">✉️ info@grandstayhotel.com</p>
          <p className="text-gray-600 text-sm">🕒 Front Desk open 24/7</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {submitted ? (
            <p className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded">
              Thank you for reaching out! We'll get back to you soon.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 mb-4"
              />

              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 mb-4"
              />

              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border rounded px-3 py-2 mb-4"
              />

              <button
                type="submit"
                className="w-full bg-[#1E3A8A] text-white py-2 rounded font-semibold hover:opacity-90"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;