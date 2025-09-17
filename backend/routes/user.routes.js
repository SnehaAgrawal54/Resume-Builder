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
  getAdminUserDetails,
} = require("../controllers/user.controller");

const router = express.Router();
const upload = require("../uploadedFiles");

router.post("/signup", upload.single("ProfilePicture"), signup);

router.post("/login", login);

router.post("/generate-otp", otpGenerator);

router.post("/verify-otp", verifyOtp);

router.get("/get-AdminUser-details/:email", getAdminUserDetails);

router.get("/get-personal-details/:email", getUserDetails);

router.post("/personal-details/:email", upload.array("resume", 5), addPersonalDetails);

router.put("/update-personal-details/:email", upload.array("resume", 5), updatePersonalDetails);

router.delete("/delete-personal-details/:email", deletePersonalDetails);

router.post("/education-details/:email", addEducationDetails);

router.put("/update-education-details/:id", updateEducationDetails);

router.delete("/delete-education-details/:id", deleteEducationDetails);

router.post("/contact-us", contactUs);

router.post("/experience-details/:email", upload.array("certificates", 5), addExperienceDetails);

router.put("/update-experience-details/:id", upload.array("certificates", 5), updateExperienceDetails);

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

router.post("/blog/:email", upload.array("images", 10), addBlog);

router.put("/update-blog/:id", upload.array("images", 10), updateBlog);

router.delete("/delete-blog/:id", deleteBlog);

router.get("/get-blog/:email", getBlog);

router.post("/template/:email", upload.array("uploadTemplateFile", 5),addTemplate);

router.put("/update-template/:id", upload.array("uploadTemplateFile", 5),updateTemplate);

router.delete("/delete-template/:id", deleteTemplate);

router.get("/get-templates/:email", getTemplates);


module.exports = router;