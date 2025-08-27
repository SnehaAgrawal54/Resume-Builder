const express = require("express");
const { signup, login, otpGenerator, verifyOtp, getUserDetails,  addPersonalDetails, updatePersonalDetails } = require("../controllers/user.controller");
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/generate-otp", otpGenerator);

router.post("/verify-otp", verifyOtp);

router.get("/get-personal-details/:email", getUserDetails);

router.post("/personal-details/:email", addPersonalDetails);

router.put("/update-personal-details/:email", updatePersonalDetails);

module.exports = router;