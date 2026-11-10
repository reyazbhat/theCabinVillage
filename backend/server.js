const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const cabinRoutes = require("./routes/cabinRoutes");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// LOCAL GALLERY IMAGE ACCESS
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// HOME / TEST ROUTE
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to The Cabin Village Backend!",
        project: "The Cabin Village",
        cabin: "RAUDAH",
        owner: "Md Ehtesham"
    });
});

// CABIN API ROUTES
app.use("/api/cabins", cabinRoutes);

// SERVER START
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log("------------------------------------");
            console.log("The Cabin Village Backend Started!");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Cabins: http://localhost:${PORT}/api/cabins`);
            console.log(
                `Gallery: http://localhost:${PORT}/api/cabins/raudah/gallery`
            );
            console.log("------------------------------------");
        });
    } catch (error) {
        console.error("Server Startup Failed:", error.message);
        process.exit(1);
    }
};

startServer();