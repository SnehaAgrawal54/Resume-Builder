const { use } = require("react");
const UserModel = require("../models/signupModel");
const UserDetailsModel = require("../models/userDetailsModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Signup controller
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create new user
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      userDetails: newUser.userDetails,
    };
    res
      .status(201)
      .json({ message: "User registered successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // console.log ("Generated Token:", token);

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      userDetails: user.userDetails,
    };
    res
      .status(200)
      .json({ message: "Login successful", user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { signup, login };