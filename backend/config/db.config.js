const mongoose = require("mongoose");
require("dotenv").config();


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

const dbConfigSchema = new mongoose.Schema({
    // Add any configuration fields if needed
    email: { type: String, required: true },
    otp: { type: String, required: true },

});


module.exports = mongoose.model("DbConfig", dbConfigSchema);