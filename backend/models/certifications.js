const mongoose = require("mongoose");

const CertificationSchema = new mongoose.Schema({
    CertificationName: { type: String, required: true },
    IssuingOrganization: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: false },
    CredentialURL: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails"},
});

module.exports = mongoose.model("Certification", CertificationSchema);