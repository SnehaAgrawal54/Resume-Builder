const mongoose = require("mongoose");
const upload = require("../uploadedFiles");
require('dotenv').config();


// mongoose.connect(process.env.MONGO_URI_ADMIN,{
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => {
//     console.log("Connected to MongoDB");
// }).catch((err) => {
//     console.log(err);
// });


const templateSchema = new mongoose.Schema({
    TemplateName: { type: String, required: true },
    Category: { type: String, required: true },
    Tags: { type: String, required: true },
    Description: { type: String, required: false },
    CompatibleFileTypes: { type: Object, required: false },
    uploadTemplateFile: { type: Object, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Template", templateSchema);