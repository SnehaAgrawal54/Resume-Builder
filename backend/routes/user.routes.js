const express = require("express");
const {
  signup,
  login,
  otpGenerator,
  verifyOtp,
  getUserDetails,
  addPersonalDetails,
  updatePersonalDetails,
  addEducationDetails,
  updateEducationDetails,
  contactUs,
  addExperienceDetails,
  updateExperienceDetails,
  addSkills,
  updateSkills,
  addCertifications,
  updateCertifications,
  addProjects,
  updateProjects,
  addSummary,
  updateSummary,
  deletePersonalDetails,
  deleteEducationDetails,
  deleteExperienceDetails,
  deleteSkills,
  deleteCertifications,
  deleteProjects,
  deleteSummary,
  addBlog,
  updateBlog,
  deleteBlog,
  getBlog,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
} = require("../controllers/user.controller");

const router = express.Router();
const upload = require("../uploadedFiles");

router.post("/signup", signup);

router.post("/login", login);

router.post("/generate-otp", otpGenerator);

router.post("/verify-otp", verifyOtp);

router.get("/get-personal-details/:email", getUserDetails);

router.post("/personal-details/:email", upload.single("resume"), addPersonalDetails);

router.put("/update-personal-details/:email", upload.single("resume"), updatePersonalDetails);

router.delete("/delete-personal-details/:email", deletePersonalDetails);

router.post("/education-details/:email", addEducationDetails);

router.put("/update-education-details/:id", updateEducationDetails);

router.delete("/delete-education-details/:id", deleteEducationDetails);

router.post("/contact-us", contactUs);

router.post("/experience-details/:email", upload.single("certificate"), addExperienceDetails);

router.put("/update-experience-details/:id", upload.single("certificate"), updateExperienceDetails);

router.delete("/delete-experience-details/:id", deleteExperienceDetails);

router.post("/skills-details/:email", addSkills);

router.put("/update-skills-details/:id", updateSkills);

router.delete("/delete-skills-details/:id", deleteSkills);

router.post("/certifications-details/:email", addCertifications);

router.put("/update-certifications-details/:id", updateCertifications);

router.delete("/delete-certifications-details/:id", deleteCertifications);

router.post("/projects-details/:email", addProjects);

router.put("/update-projects-details/:id", updateProjects);

router.delete("/delete-projects-details/:id", deleteProjects);

router.post("/summary/:email", addSummary);

router.put("/update-summary/:id", updateSummary);

router.delete("/delete-summary/:id", deleteSummary);

router.post("/blog/:email", upload.array("images"), addBlog);

router.put("/update-blog/:id", upload.array("images"), updateBlog);

router.delete("/delete-blog/:id", deleteBlog);

router.get("/get-blog/:email", getBlog);

router.post("/template/:email",upload.single("template") ,addTemplate);

router.put("/update-template/:id",upload.single("template") ,updateTemplate);

router.delete("/delete-template/:id", deleteTemplate);

router.get("/get-templates/:email", getTemplates);


module.exports = router;