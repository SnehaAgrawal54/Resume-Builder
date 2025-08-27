const { use } = require("react");
const UserModel = require("../models/signupModel");
const UserDetailsModel = require("../models/userDetailsModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodeMailer = require("nodemailer");
const dbConfigModel = require("../config/db.config");


// OTP generation and email sending
const otpGenerator = async (req, res) => {
  const {email} = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
  // Set up nodemailer transporter
  try {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for email verification is: ${otp}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Error sending email", error });
      } else {
        // otp needs to be hashed and stored in DB with expiry in production
        const hashedOtp = bcrypt.hash(otp.toString(), saltRounds, expiresIn='10m');
        const newOtpEntry = new dbConfigModel({
          email,
          otp: hashedOtp,
        });
        newOtpEntry.save();
        return res
          .status(200)
          .json({ message: "OTP sent successfully"}); // In production, do not send OTP in response
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}


// verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpEntry = await dbConfigModel.findOne({ email });
    if (!otpEntry) {
      return res.status(400).json({ message: "OTP expired. Please request a new one."});
    }
    const isOtpValid = await bcrypt.compare(otp.toString(), otpEntry.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await dbConfigModel
      .findOneAndDelete({ email })
      .catch((err) => console.log("Error deleting OTP entry: ", err));
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

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

module.exports = { signup, login, otpGenerator, verifyOtp };