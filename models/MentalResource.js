// models/MentalResource.js
const mongoose = require("mongoose");

const MentalResourceSchema = new mongoose.Schema({
  title: String,
  description: String,
  link: String,
});

module.exports = mongoose.model("MentalResource", MentalResourceSchema);
