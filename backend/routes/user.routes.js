const express = require("express");
const { signup, login, otpGenerator, verifyOtp, getUserDetails,  addPersonalDetails, updatePersonalDetails, addEducationDetails, updateEducationDetails, contactUs, addexperience, updateExperienceDetails, addSkills, updateSkills, addCertifications, updateCertifications, addProjects, updateProjects, addSummary, updateSummary } = require("../controllers/user.controller");
const router = express.Router();
const upload = require("../uploadedFiles");

router.post("/signup", signup);

router.post("/login", login);

router.post("/generate-otp", otpGenerator);

router.post("/verify-otp", verifyOtp);

router.get("/get-personal-details/:email", getUserDetails);

router.post("/personal-details/:email", upload.single("resume"), addPersonalDetails);

router.put("/update-personal-details/:email", upload.single("resume"), updatePersonalDetails);

router.post("/education-details/:email", addEducationDetails);

router.put("/update-education-details/:id", updateEducationDetails);

router.post("/contact-us", contactUs);

router.post("/experience-details/:email", upload.single("certificate"), addexperience);

router.put("/update-experience-details/:id", upload.single("certificate"), updateExperienceDetails);

router.post("/skills-details/:email", addSkills);

router.put("/update-skills-details/:id", updateSkills);

router.post("/certifications-details/:email", addCertifications);

router.put("/update-certifications-details/:id", updateCertifications);

router.post("/projects-details/:email", addProjects);

router.put("/update-projects-details/:id", updateProjects);

router.post("/summary-details/:email", addSummary);

router.put("/update-summary-details/:id", updateSummary);

module.exports = router;