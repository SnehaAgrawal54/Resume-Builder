const UserModel = require("../models/signupModel");
const UserDetailsModel = require("../models/userDetailsModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodeMailer = require("nodemailer");
const dbConfigModel = require("../config/db.config");
const EducationModel = require("../models/education");


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
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Error sending email", error });
      } else {
        // otp needs to be hashed and stored in DB with expiry in production
        const hashedOtp = await bcrypt.hash(otp.toString(), saltRounds);
        const newOtpEntry = new dbConfigModel({
          email,
          otp: hashedOtp,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000, //
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
    if (otpEntry.expiresAt < new Date()) {
      await dbConfigModel.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }
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
    const token = jwt.sign({ id: user.email }, process.env.JWT_SECRET, {
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

// get all details of user
const getUserDetails = async (req, res) => {
  try {
    const email = req.params.email; // Assuming user ID is available in req.user after authentication middleware
    const user = await UserModel.findOne({email}).populate('userDetails').select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// post some details of user in personal details
const addPersonalDetails = async (req, res) => {
  try {
    const email = req.params.email; // Assuming user ID is available in req.user after authentication middleware
    const { firstName, lastName, phoneNo, country, stateOrUnionTerritory, city, distinct, languagesKnown, hobies, linkedIn, github, website, jobTitle } = req.body;
    const resume =req.file? `/uploads/${req.file.filename}` : null ; // Placeholder path, in real scenario handle file upload
    const user = await UserModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newDetails = new UserDetailsModel({
      resume,
      firstName,
      lastName,
      email,
      phoneNo,
      country,
      stateOrUnionTerritory,
      city,
      distinct,
      languagesKnown,
      hobies,
      linkedIn,
      github,
      website,
      jobTitle,
      user: user._id,
    });
    await newDetails.save();
    user.userDetails.push(newDetails._id);
    await user.save();
    res.status(200).json({ message: "User details added successfully", newDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update personal details
const updatePersonalDetails = async (req, res) => {
  try {
    const email = req.params.email; // Assuming user ID is available in req.user after authentication middleware
    const {
      firstName,
      lastName,
      phoneNo,
      country,
      stateOrUnionTerritory,
      city,
      distinct,
      languagesKnown,
      hobies,
      linkedIn,
      github,
      website,
      jobTitle,
    } = req.body;
    const user = await UserModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userDetailsId = user.userDetails[0]; // Assuming one-to-one relationship for simplicity
    if (!userDetailsId) {
      return res.status(404).json({ message: "User details not found" });
    }
    const updateData = {
      firstName,
      lastName,
      phoneNo,
      country,
      stateOrUnionTerritory,
      city,
      distinct,
      languagesKnown,
      hobies,
      linkedIn,
      github,
      website,
      jobTitle,
    };
    if (req.file) {
      updateData.resume = `/uploads/${req.file.filename}`;
    }
    const updatedDetails = await UserDetailsModel.findByIdAndUpdate(
      userDetailsId,
      updateData,
      { new: true }
    );
    if (!updatedDetails) {
      return res.status(404).json({ message: "User details not found" });
    }
    res.status(200).json({ message: "User details updated successfully", updatedDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// post education details
const addEducationDetails = async (req, res) => {
  // To be implemented
  try{
    const email = req.params.email;
    const { institutionName, degree, fieldOfStudy, startDate, endDate, location, grade, acheavements, discription } = req.body;
    const user = await UserModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const education = new EducationModel({
      institutionName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      location,
      grade,
      acheavements,
      discription,
      user: user._id,
    });
    await user.education.push(education._id);
    await education.save();
    await user.save();
    res.status(200).json({ message: "Education details added successfully", education });
  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update education details
const updateEducationDetails = async (req, res) => {
  // To be implemented
  try{
    const educationId = req.params.id;
    const { institutionName, degree, fieldOfStudy, startDate, endDate, location, grade, acheavements, discription } = req.body;
    const education = await EducationModel.findById(educationId); // Assuming one-to-one relationship for simplicity
    if (!education) {
      return res.status(404).json({ message: "Education details not found" });
    }
    const updatedEducation = await EducationModel.findByIdAndUpdate(
      educationId,
      {
        institutionName,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        location,
        grade,
        acheavements,
        discription,
      },
      { new: true }
    );
    res.status(200).json({ message: "Education details updated successfully", education:updatedEducation });
  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// contact us node mailer added here
const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_US_EMAIL,
      subject: `Contact Us Message from ${name} with email ${email}`,
      text: message,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Error sending email", error });
      } else {
        return res
          .status(200)
          .json({ message: "Message sent successfully" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// eperience, skills, summary controllers to be added similarly

module.exports = { signup, login, otpGenerator, verifyOtp, getUserDetails, addPersonalDetails, updatePersonalDetails, addEducationDetails, updateEducationDetails, contactUs };