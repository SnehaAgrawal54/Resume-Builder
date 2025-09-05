const UserModel = require("../models/signupModel");
const UserDetailsModel = require("../models/userDetailsModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodeMailer = require("nodemailer");
const dbConfigModel = require("../config/db.config");
const EducationModel = require("../models/education");
const ExperienceModel = require("../models/experience");
const SkillModel = require("../models/skills");
const CertificationModel = require("../models/certifications");
const ProjectModel = require("../models/projects");
const SummaryModel = require("../models/summary");
const BlogModel = require("../models/Blog");
const TemplateModel = require("../models/template");
const multer = require("multer");
const path = require("path");



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
    const resume =req.file? `/uploads/resume/${req.file.filename}` : null ; // Placeholder path, in real scenario handle file upload
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
    user.userDetails.push(newDetails._id);
    await newDetails.save();
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
      updateData.resume = `/uploads/resume/${req.file.filename}`;
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

// delete personal details
const deletePersonalDetails = async (req, res) => {
  try {
    const email = req.params.email; // Assuming user ID is available in req.user after authentication middleware
    const user = await UserModel.findOne({ email }).populate("userDetails");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userDetailsId = user.userDetails[0]; // Assuming one-to-one relationship for simplicity
    if (!userDetailsId) {
      return res.status(404).json({ message: "User details not found" });
    }
    const userDetails = UserDetailsModel.findById(userDetailsId);
    if (!userDetails) {
      return res.status(404).json({ message: "User details not found" });
    }

    // Delete all referenced docs
    await Promise.all([
      SummaryModel.deleteMany({ _id: { $in: userDetails.summary } }),
      EducationModel.deleteMany({ _id: { $in: userDetails.education } }),
      ExperienceModel.deleteMany({ _id: { $in: userDetails.experience } }),
      ProjectModel.deleteMany({ _id: { $in: userDetails.projects } }),
      SkillModel.deleteMany({ _id: { $in: userDetails.skills } }),
      CertificationModel.deleteMany({
        _id: { $in: userDetails.certifications },
      }),
    ]);

    // delete the userDetails itself
    await UserDetailsModel.findByIdAndDelete(userDetailsId);

    // Remove reference from User model
    user.userDetails = user.userDetails.filter(
      (detailId) => detailId.toString() !== userDetailsId.toString()
    );
    await user.save();
    res.status(200).json({ message: "User details deleted successfully" });
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
    const user = await UserDetailsModel.findOne({email});
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
    user.education.push(education._id);
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
    console.log("Education ID:", educationId);
    const education = await EducationModel.findById(educationId);
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

// delete education details
const deleteEducationDetails = async (req, res) => {
  try {
    const educationId = req.params.id;
    const education = await EducationModel.findById(educationId);
    if (!education) {
      return res.status(404).json({ message: "Education details not found" });
    }
    const userId = education.user;
    await EducationModel.findByIdAndDelete(educationId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.education = user.education.filter(
        (eduId) => eduId.toString() !== educationId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Education details deleted successfully" });
  } catch (error) {
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
const addExperienceDetails = async (req, res) => {
  try {
    const {companyLocation, jobTitle, companyName, employeeType, location, startDate, endDate, workSamples, discription, keyAchievements} = req.body;
    const email = req.params.email;
    const certificates = req.file? `/uploads/certificate/${req.file.filename}` : null ;
    const user = await UserDetailsModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
      }
    const experience = new ExperienceModel({
      jobTitle,
      companyName,
      employeeType,
      location,
      startDate,
      endDate,
      workSamples,
      discription,
      companyLocation,
      keyAchievements,
      certificates,
      user: user._id,
    });
    user.experience.push(experience._id);
    await experience.save();
    await user.save();
    res.status(200).json({ message: "Experience details added successfully", experience });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update education details
const updateExperienceDetails = async (req, res) => {
  try{
    const experienceId = req.params.id;
    const {companyLocation, jobTitle, companyName, employeeType, location, startDate, endDate, workSamples, discription, keyAchievements } = req.body;
    const experience = await ExperienceModel.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience details not found" });
    }
    const updateData = {
        jobTitle,
        companyName,
        companyLocation,
        employeeType,
        location,
        startDate,
        endDate,
        workSamples,
        discription,
        keyAchievements,
      };
    if (req.file) {
      updateData.certificates = `/uploads/certificate/${req.file.filename}`;
    }
    const updatedExperience = await ExperienceModel.findByIdAndUpdate(experienceId,
      updateData,
      { new: true }
    );
    res.status(200).json({ message: "Experience details updated successfully", experience:updatedExperience });
  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete experience details
const deleteExperienceDetails = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const experience = await ExperienceModel.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience details not found" });
    }
    const userId = experience.user;
    await ExperienceModel.findByIdAndDelete(experienceId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.experience = user.experience.filter(
        (expId) => expId.toString() !== experienceId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Experience details deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add skills
const addSkills = async (req, res) => {
  try {
    const email = req.params.email;
    const { skillName, proficiency, skillCategory } = req.body; // Expecting an array of skills
    const user = await UserDetailsModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const skills = new SkillModel({
      skillName,
      proficiency,
      skillCategory,
      user: user._id,
    });
    user.skills.push(skills._id);
    await skills.save();
    await user.save();
    res.status(200).json({ message: "Skills added successfully", skills });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update skills
const updateSkills = async (req, res) => {
  try {
    const skillId = req.params.id;
    const { skillName, proficiency, skillCategory } = req.body;
    const skill = await SkillModel.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    } 
    const updatedSkill = await SkillModel.findByIdAndUpdate(
      skillId,
      { skillName, proficiency, skillCategory },
      { new: true }
    );
    res.status(200).json({ message: "Skill updated successfully", skill: updatedSkill });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete skills
const deleteSkills = async (req, res) => {
  try {
    const skillId = req.params.id;
    const skill = await SkillModel.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    const userId = skill.user;
    await SkillModel.findByIdAndDelete(skillId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.skills = user.skills.filter(
        (sId) => sId.toString() !== skillId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add certifications
const addCertifications = async (req, res) => {
  try {
    const email = req.params.email;
    const {
      CertificationName,
      IssuingOrganization,
      startDate,
      endDate,
      description,
      CredentialURL,
    } = req.body; // Expecting an array of certifications
    const user = await UserDetailsModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const certifications = new CertificationModel({
      CertificationName,
      IssuingOrganization,
      startDate,
      endDate,
      description,
      CredentialURL,
      user: user._id,
    });
    user.certifications.push(certifications._id);
    await certifications.save();
    await user.save();
    res.status(200).json({ message: "Certifications added successfully", certifications });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update certifications
const updateCertifications = async (req, res) => {
  try {
    const certificationId = req.params.id;
    const {
      CertificationName,
      IssuingOrganization,
      startDate,
      endDate,
      description,
      CredentialURL,
    } = req.body;
    const certification = await CertificationModel.findById(certificationId);
    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }
    const updatedCertification = await CertificationModel.findByIdAndUpdate(
      certificationId,
      {
        CertificationName,
        IssuingOrganization,
        startDate,
        endDate,
        description,
        CredentialURL,
      },
      { new: true }
    );
    res.status(200).json({ message: "Certification updated successfully", certification: updatedCertification });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete certifications
const deleteCertifications = async (req, res) => {
  try {
    const certificationId = req.params.id;
    const certification = await CertificationModel.findById(certificationId);
    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }
    const userId = certification.user;
    await CertificationModel.findByIdAndDelete(certificationId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.certifications = user.certifications.filter(
        (cId) => cId.toString() !== certificationId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Certification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add projects
const addProjects = async (req, res) => {
  try {
    const email = req.params.email;
    const {
      projectTitle,
      organization,
      position,
      projectLink,
      startDate,
      endDate,
      projectDiscription,
      technologies,
    } = req.body; // Expecting an array of projects
    const user = await UserDetailsModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const projects = new ProjectModel({
    projectTitle,
    organization,
    position,
    projectLink,
    startDate,
    endDate,
    projectDiscription,
    technologies,
    user: user._id,
    });
    user.projects.push(projects._id);
    await projects.save();
    await user.save();
    res.status(200).json({ message: "Projects added successfully", projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update projects
const updateProjects = async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      projectTitle,
      organization,
      position,
      projectLink,
      startDate,
      endDate,
      projectDiscription,
      technologies,
    } = req.body;
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const updatedProject = await ProjectModel.findByIdAndUpdate(
      projectId,
      {
        projectTitle,
        organization,
        position,
        projectLink,
        startDate,
        endDate,
        projectDiscription,
        technologies,
      },
      { new: true }
    );
    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete projects
const deleteProjects = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectModel.findById(projectId);
    if (!project) { 
      return res.status(404).json({ message: "Project not found" });
    }
    const userId = project.user;
    await ProjectModel.findByIdAndDelete(projectId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.projects = user.projects.filter( 
        (pId) => pId.toString() !== projectId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add summary
const addSummary = async (req, res) => {
  try {
    const email = req.params.email;
    const { summaryObjective } = req.body;
    const user = await UserDetailsModel.findOne({email});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const summary = new SummaryModel({
      summaryObjective,
      user: user._id,
    });
    user.summary.push(summary._id);
    await summary.save();
    await user.save();
    res.status(200).json({ message: "Summary added successfully", summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update summary
const updateSummary = async (req, res) => {
  try {
    const summaryId = req.params.id;
    const { summaryObjective } = req.body;
    const summary = await SummaryModel.findById(summaryId);
    if (!summary) {
      return res.status(404).json({ message: "Summary not found" });
    }
    const updatedSummary = await SummaryModel.findByIdAndUpdate(
      summaryId,
      { summaryObjective },
      { new: true }
    );
    res.status(200).json({ message: "Summary updated successfully", summary: updatedSummary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete summary
const deleteSummary = async (req, res) => {
  try {
    const summaryId = req.params.id;
    const summary = await SummaryModel.findById(summaryId);
    if (!summary) {
      return res.status(404).json({ message: "Summary not found" });
    }
    const userId = summary.user;
    await SummaryModel.findByIdAndDelete(summaryId);
    const user = await UserDetailsModel.findById(userId);
    if (user) {
      user.summary = user.summary.filter(
        (sId) => sId.toString() !== summaryId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Summary deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add Blogs
const addBlog = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserModel.findOne({email});
    if (!user){
      return res.status(404).json({ message: "User not found" });
    }
    const { Title, Keywords, Slug, Description, Content } = req.body;
    const images = req.file? `/uploads/blog/${req.file.filename}` : null ;
    const blog = new BlogModel({
      Title,
      Keywords,
      Slug,
      Description,
      Content,
      images,
      user: user._id,
    });
    user.blog.push(blog._id);
    await blog.save();
    await user.save();
    res.status(200).json({ message: "Blog added successfully", blog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update Blogs
const updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { Title, Keywords, Slug, Description, Content } = req.body;
    const images = req.file? `/uploads/blog/${req.file.filename}` : null ;
    const blog = await BlogModel.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      blogId,
      {
        Title,
        Keywords,
        Slug,
        Description,
        Content,
        images,
      },
      { new: true }
    );
    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete Blogs
const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await BlogModel.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const userId = blog.user;
    await BlogModel.findByIdAndDelete(blogId);
    const user = await UserModel.findById(userId);
    if (user) {
      user.blog = user.blog.filter(
        (bId) => bId.toString() !== blogId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// add Templates
const addTemplate = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserModel.findOne({email});
    if (!user){
      return res.status(404).json({ message: "User not found" });
    }
    const { 
    TemplateName,
    Category,
    Tags,
    Description,
    uploadTemplateFile,
    } = req.body;
    const CompatibleFileTypes = req.file? `/uploads/template/${req.file.filename}` : null ;
    const TemplateNameExists = await TemplateModel.findOne({ TemplateName });
    if (TemplateNameExists) {
      return res.status(400).json({ message: "Template already exists" });
    }
    const userId = user._id;
    const template = new TemplateModel({
      TemplateName,
      Category,
      Tags,
      Description,
      CompatibleFileTypes,
      uploadTemplateFile,
      user: userId,
    });
    user.template.push(template._id);
    await template.save();
    await user.save();
    res.status(200).json({ message: "Template added successfully", template})
  } catch(error){
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// update Templates
const updateTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const {
      TemplateName,
      Category,
      Tags,
      Description,
      uploadTemplateFile,
    } = req.body;
    const CompatibleFileTypes = req.file? `/uploads/template/${req.file.filename}` : null ;
    const template = await TemplateModel.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const updatedTemplate = await TemplateModel.findByIdAndUpdate(
      templateId,
      {
        TemplateName,
        Category,
        Tags,
        Description,
        CompatibleFileTypes,
        uploadTemplateFile,
      },
      { new: true }
    );
    res.status(200).json({ message: "Template updated successfully", template: updatedTemplate });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete Templates
const deleteTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await TemplateModel.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const userId = template.user;
    await TemplateModel.findByIdAndDelete(templateId);
    const user = await UserModel.findById(userId);
    if (user) {
      user.template = user.template.filter(
        (tId) => tId.toString() !== templateId.toString()
      );
      await user.save();
    }
    res.status(200).json({ message: "Template deleted successfully" });
  } catch(error){
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// get Templates
const getTemplates = async (req, res) => {
  try {
    const email = req.params.email;
    const usertemplates = await UserModel.findOne({email}).populate('template');
    if (!usertemplates){
      return res.status(404).json({ message: "Templates not found" });
    }
    res.status(200).json({ usertemplates });
  } catch(error){
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// get Blogs
const getBlog = async (req, res) => {
  try {
    const email = req.params.email;
    const userblogs = await UserModel.findOne({email}).populate('blog');
    if (!userblogs){
      return res.status(404).json({ message: "Blogs not found" });
    }
    res.status(200).json({ userblogs });
  } catch(error){
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// get Admin user details
const getAdminUserDetails = async (req, res) =>{
  try {
    const email = req.params.email;
    const adminUserDetails = await UserModel.findOne({email}).populate('blog template').select('-password');
    if (!adminUserDetails) {
      return res.status(404).json({ message: "User details not found" });
    }
    res.status(200).json({ adminUserDetails });
  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message })
  }
};

// get PersonalDetails
// const getPersonalDetails = async (req, res) => {
//   try {
//     const email = req.params.email;
//     const PersonalDetails = await UserDetailsModel.findOne({email}).populate('education experience skills certifications projects summary').populate('user').select('-password');
//     if (!PersonalDetails) {
//       return res.status(404).json({ message: "Personal details not found" });
//     }
//     res.status(200).json({ PersonalDetails });
//     } catch (error) {
//       res.status(500).json({ message: "Server error", error: error.message })
//     }
//   };


module.exports = {
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
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
  getBlog,
  getAdminUserDetails,
};