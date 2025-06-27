//authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.picture,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.googleAuthSuccess = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const token = createToken(req.user);

  return res.status(200).json({ token });
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);

    res.status(200).json({ message: "Logout successful" });
  });
};
