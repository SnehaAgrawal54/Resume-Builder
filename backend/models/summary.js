const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
    summaryObjective: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Summary", summarySchema);