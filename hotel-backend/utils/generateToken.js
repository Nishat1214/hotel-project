import jwt from "jsonwebtoken";

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // token stays valid for 7 days
  );
};

export default generateToken;