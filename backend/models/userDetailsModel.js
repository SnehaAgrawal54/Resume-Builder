const express = require("express");
const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNo: { type: String, required: true },
  country: { type: String, required: false },
  pincode: { type: String, required: false },
  linkedIn: { type: String, required: false },
  github: { type: String, required: false },
  portfolio: { type: String, required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("UserDetails", userDetailsSchema);
