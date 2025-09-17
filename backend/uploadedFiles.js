const multer = require("multer");
const path = require("path");
const fs = require("fs");

// map of field names to subfolders
const folderMap = {
  ProfilePicture: "profilePictures",
  resume: "resumes",
  certificate: "certificates",
  images: "blogs",
  template: "templates",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // default fallback
    let folder = "others";

    if (folderMap[file.fieldname]) {
      folder = folderMap[file.fieldname];
    }

    const uploadPath = path.join(__dirname, "uploads", folder);

    // create folder if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

module.exports = upload;
