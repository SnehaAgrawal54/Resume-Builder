const express = require("express");
const mongoose = require("mongoose");

// UserDetails.js
const userDetailsSchema = new mongoose.Schema({
  resume: [{ type: String }], // ✅ multiple resumes
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNo: { type: String, required: true },
  country: { type: String, required: false },
  stateOrUnionTerritory: { type: String, required: false },
  city: { type: String, required: false },
  distinct: { type: String, required: false },
  linkedIn: { type: String, required: false },
  github: { type: String, required: false },
  jobTitle: { type: String, required: false },
  website: { type: String, required: false },
  languagesKnown: { type: String, required: false },
  hobies: { type: String, required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  summary: [{ type: mongoose.Schema.Types.ObjectId, ref: "Summary" }],
  education: [{ type: mongoose.Schema.Types.ObjectId, ref: "Education" }],
  experience: [{ type: mongoose.Schema.Types.ObjectId, ref: "Experience" }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  certifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Certification" }],
});


module.exports = mongoose.model("UserDetails", userDetailsSchema);
