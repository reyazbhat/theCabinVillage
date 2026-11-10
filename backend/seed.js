
require("dotenv").config();

const connectDB = require("./config/db");
const Cabin = require("./models/Cabin");

const seedCabin = async () => {
    try {
        await connectDB();

        const rauDahData = {
            slug: "raudah",
            owner: "Md Ehtesham",
            cabinTitle: "RAUDAH",
            phoneNumber: "",
            email: "",
            icon: "🥰",

            // All RAUDAH sections
            projects: [],
            poetry: [],
            skills: [],
            achievements: [],
            gallery: [],
            diary: [],
            gaming: []
        };

        const cabin = await Cabin.findOneAndUpdate(
            { slug: "raudah" },
            {
                $setOnInsert: rauDahData
            },
            {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        console.log("--------------------------------");
        console.log("RAUDAH saved successfully!");
        console.log("--------------------------------");

        console.log("Owner:", cabin.owner);
        console.log("Cabin:", cabin.cabinTitle);

        console.log("Projects:", cabin.projects.length);
        console.log("Poetry:", cabin.poetry.length);
        console.log("Skills:", cabin.skills.length);
        console.log("Achievements:", cabin.achievements.length);
        console.log("Gallery:", cabin.gallery.length);
        console.log("Diary:", cabin.diary.length);
        console.log("Gaming:", cabin.gaming.length);

        console.log("--------------------------------");
        console.log("All existing data is preserved!");
        console.log("--------------------------------");

        process.exit(0);

    } catch (error) {
        console.error("Error saving RAUDAH:", error.message);
        process.exit(1);
    }
};

seedCabin();
