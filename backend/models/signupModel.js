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

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength:[3, "minimum 3 characters required"], maxlength: 30 },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    ],
  },
  userDetails:[ 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
    }],
});

module.exports = mongoose.model("User", userSchema);