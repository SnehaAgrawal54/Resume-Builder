const mongoose = require("mongoose");
require("dotenv").config();


const dbConfigSchema = new mongoose.Schema({
    // Add any configuration fields if needed
    email: { type: String, required: true },
    otp: { type: String, required: true },

});


module.exports = mongoose.model("DbConfig", dbConfigSchema);