const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    storageProvider: {
        type: String,
        enum: ["local", "cloudinary"],
        default: "local"
    },
    publicId: { type: String, default: "" },
    fileName: { type: String, default: "" }
}, { timestamps: true });

const cabinSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        owner: { type: String, required: true },
        cabinTitle: { type: String, required: true },
        phoneNumber: { type: String, default: "" },
        email: { type: String, default: "" },
        icon: { type: String, default: "🏡" },

        projects: [{
            title: String,
            description: String,
            image: String,
            link: String
        }],

        poetry: [{
            title: String,
            content: String
        }],

        skills: [{
            name: String,
            level: String
        }],

        achievements: [{
            title: String,
            description: String,
            date: String
        }],

        gallery: [gallerySchema],

        diary: [{
            title: String,
            content: String,
            date: String
        }],

        gaming: [{
            gameName: String,
            rank: String,
            details: String
        }]
    },
    { timestamps: true }
);

const Cabin = mongoose.model("Cabin", cabinSchema);

module.exports = Cabin;