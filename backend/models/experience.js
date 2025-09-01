const mongoose = require("mongoose");


const experienceSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    employeeType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    companyLocation: { type: String, required: true },
    workSamples: { type: String, required: false },
    discription: { type: String, required: true },
    keyAchievements: { type: String, required: false },
    certificates: { type: Object, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Experience", experienceSchema);