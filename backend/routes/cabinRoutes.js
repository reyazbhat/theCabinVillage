const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
    createCabin,
    getAllCabins,
    getCabinBySlug,
    updateCabin,
    deleteCabin,
    getSectionItems,
    addSectionItem,
    updateSectionItem,
    deleteSectionItem
} = require("../controllers/cabinController");

const {
    getGallery,
    uploadGalleryPhotos,
    updateGalleryPhoto,
    deleteGalleryPhoto
} = require("../controllers/galleryController");

// Photos memory mein temporarily receive hongi.
// Uske baad local disk ya Cloudinary par save hongi.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 20
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith("image/")) {
            callback(null, true);
        } else {
            callback(new Error("Only image files are allowed."));
        }
    }
});

// Cabin routes
router.post("/", createCabin);
router.get("/", getAllCabins);

// SPECIAL GALLERY ROUTES
router.get("/:slug/gallery", getGallery);
router.post("/:slug/gallery/upload", upload.array("photos", 20), uploadGalleryPhotos);
router.put("/:slug/gallery/:itemId", updateGalleryPhoto);
router.delete("/:slug/gallery/:itemId", deleteGalleryPhoto);

// Other section routes
router.get("/:slug/:section", getSectionItems);
router.post("/:slug/:section", addSectionItem);
router.put("/:slug/:section/:itemId", updateSectionItem);
router.delete("/:slug/:section/:itemId", deleteSectionItem);

// Single cabin routes
router.get("/:slug", getCabinBySlug);
router.put("/:slug", updateCabin);
router.delete("/:slug", deleteCabin);

// Multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: error.code === "LIMIT_FILE_SIZE"
                ? "Each photo must be 10 MB or smaller."
                : error.code === "LIMIT_FILE_COUNT"
                    ? "You can upload a maximum of 20 photos at once."
                    : error.message
        });
    }

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next();
});

module.exports = router;