const express = require("express");
const { signup, login, otpGenerator, verifyOtp } = require("../controllers/user.controller");
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/generate-otp", otpGenerator);

router.post("/verify-otp", verifyOtp);

module.exports = router;