const Cabin = require("../models/Cabin");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const CABIN_SLUG = "raudah";

const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const uploadDirectory = path.join(__dirname, "../uploads/gallery");

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "the-cabin-village/raudah/gallery",
                resource_type: "image"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

const saveLocally = async (file) => {
    await fs.promises.mkdir(uploadDirectory, { recursive: true });

    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = /^\.(jpg|jpeg|png|webp|gif|avif)$/.test(extension)
        ? extension
        : ".jpg";

    const fileName =
        `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExtension}`;

    const filePath = path.join(uploadDirectory, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
        imageUrl: `/uploads/gallery/${fileName}`,
        storageProvider: "local",
        publicId: "",
        fileName
    };
};

const storeImage = async (file) => {
    if (cloudinaryConfigured) {
        const result = await uploadToCloudinary(file.buffer);

        return {
            imageUrl: result.secure_url,
            storageProvider: "cloudinary",
            publicId: result.public_id,
            fileName: file.originalname
        };
    }

    return saveLocally(file);
};

const deleteStoredImage = async (image) => {
    if (image.storageProvider === "cloudinary" && image.publicId) {
        await cloudinary.uploader.destroy(image.publicId, {
            resource_type: "image"
        });
        return;
    }

    if (image.storageProvider === "local" && image.fileName) {
        const filePath = path.join(uploadDirectory, path.basename(image.fileName));

        try {
            await fs.promises.unlink(filePath);
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }
    }
};

const getCabin = async () => {
    return Cabin.findOne({ slug: CABIN_SLUG });
};

// GET GALLERY
const getGallery = async (req, res) => {
    try {
        if (req.params.slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Cabin not found."
            });
        }

        const cabin = await getCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found."
            });
        }

        res.json({
            success: true,
            count: cabin.gallery.length,
            data: cabin.gallery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPLOAD SINGLE OR MULTIPLE PHOTOS
const uploadGalleryPhotos = async (req, res) => {
    const savedImages = [];

    try {
        if (req.params.slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Cabin not found."
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one photo."
            });
        }

        const cabin = await getCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found."
            });
        }

        let notes = [];

        try {
            notes = JSON.parse(req.body.notes || "[]");
        } catch {
            notes = [];
        }

        for (let index = 0; index < req.files.length; index++) {
            const file = req.files[index];

            if (!file.mimetype.startsWith("image/")) {
                throw new Error(`${file.originalname} is not a valid image.`);
            }

            const stored = await storeImage(file);
            savedImages.push(stored);

            cabin.gallery.push({
                ...stored,
                caption: typeof notes[index] === "string"
                    ? notes[index].trim().slice(0, 500)
                    : ""
            });
        }

        await cabin.save();

        const addedItems = cabin.gallery.slice(-req.files.length);

        res.status(201).json({
            success: true,
            message: `${addedItems.length} photo(s) uploaded successfully!`,
            data: addedItems
        });
    } catch (error) {
        for (const image of savedImages) {
            try {
                await deleteStoredImage(image);
            } catch (cleanupError) {
                console.error("Upload cleanup failed:", cleanupError.message);
            }
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE PHOTO NOTE
const updateGalleryPhoto = async (req, res) => {
    try {
        if (req.params.slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Cabin not found."
            });
        }

        const cabin = await getCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found."
            });
        }

        const photo = cabin.gallery.id(req.params.itemId);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found."
            });
        }

        photo.caption = String(req.body.caption || "").trim().slice(0, 500);

        await cabin.save();

        res.json({
            success: true,
            message: "Photo note updated!",
            data: photo
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE PHOTO
const deleteGalleryPhoto = async (req, res) => {
    try {
        if (req.params.slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Cabin not found."
            });
        }

        const cabin = await getCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found."
            });
        }

        const photo = cabin.gallery.id(req.params.itemId);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found."
            });
        }

        const imageDetails = photo.toObject();

        await deleteStoredImage(imageDetails);

        photo.deleteOne();
        await cabin.save();

        res.json({
            success: true,
            message: "Photo deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getGallery,
    uploadGalleryPhotos,
    updateGalleryPhoto,
    deleteGalleryPhoto
};