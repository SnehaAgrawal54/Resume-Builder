const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
    projectTitle: { type: String, required: true },
    organization: { type: String, required: true },
    position: { type: String, required: true },
    projectLink: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    projectDiscription: { type: String, required: true },
    technologies: [{ type: String, required: true }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Project", ProjectSchema);