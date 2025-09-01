const mongoose = require("mongoose");


const educationSchema = new mongoose.Schema({
    institutionName: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    location: { type: String, required: false },
    grade: { type: String, required: false },
    acheavements: { type: String, required: false },
    discription: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Education", educationSchema);