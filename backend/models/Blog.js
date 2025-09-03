const mongoose = require("mongoose");


const BlogSchema = new mongoose.Schema({
    Title: { type: String, required: true },
    Keywords: { type: String, required: true },
    Slug: { type: String, required: true },
    Description: { type: String, required: true },
    Content: { type: String, required: true },
    images:{ type: Object, required: false },
});

module.exports = mongoose.model("Blog", BlogSchema);