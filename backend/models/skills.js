const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    skillCategory: { type: String, required: true },
    proficiencyLevel: { type: String, required: false },
    skillName: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Skill", skillSchema);