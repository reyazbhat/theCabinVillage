
const Cabin = require("../models/Cabin");

// Member 6 ka fixed cabin
const CABIN_SLUG = "raudah";

// Allowed section names and their fields
const SECTION_CONFIG = {
    projects: ["title", "description", "image", "link"],
    poetry: ["title", "content"],
    skills: ["name", "level"],
    achievements: ["title", "description", "date"],
    gallery: ["imageUrl", "caption"],
    diary: ["title", "content", "date"],
    gaming: ["gameName", "rank", "details"]
};

const PROFILE_FIELDS = [
    "owner",
    "cabinTitle",
    "phoneNumber",
    "email",
    "icon"
];

// Helper: only allow approved fields
const pickFields = (body, allowedFields) => {
    const result = {};

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            result[field] = body[field];
        }
    }

    return result;
};

// Helper: find RAUDAH cabin
const findCabin = async () => {
    return Cabin.findOne({ slug: CABIN_SLUG });
};

// =====================================
// CREATE - Create RAUDAH cabin
// =====================================
const createCabin = async (req, res) => {
    try {
        const cabinData = {
            ...pickFields(req.body, [
                "owner",
                "cabinTitle",
                "phoneNumber",
                "email",
                "icon"
            ]),
            slug: CABIN_SLUG
        };

        const cabin = await Cabin.findOneAndUpdate(
            { slug: CABIN_SLUG },
            { $setOnInsert: cabinData },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            message: "RAUDAH cabin is ready!",
            data: cabin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// READ - Get RAUDAH cabin
// =====================================
const getAllCabins = async (req, res) => {
    try {
        const cabin = await findCabin();

        res.status(200).json({
            success: true,
            count: cabin ? 1 : 0,
            data: cabin ? [cabin] : []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// READ - Get RAUDAH by slug
// =====================================
const getCabinBySlug = async (req, res) => {
    try {
        const slug = req.params.slug.trim().toLowerCase();

        if (slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Only the RAUDAH cabin is available in this backend."
            });
        }

        const cabin = await findCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        res.status(200).json({
            success: true,
            data: cabin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// UPDATE - Update RAUDAH profile
// =====================================
const updateCabin = async (req, res) => {
    try {
        const slug = req.params.slug.trim().toLowerCase();

        if (slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Only the RAUDAH cabin can be updated."
            });
        }

        const updates = pickFields(req.body, PROFILE_FIELDS);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid profile fields provided."
            });
        }

        const cabin = await Cabin.findOneAndUpdate(
            { slug: CABIN_SLUG },
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "RAUDAH profile updated successfully!",
            data: cabin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// DELETE - Delete RAUDAH cabin
// =====================================
const deleteCabin = async (req, res) => {
    try {
        const slug = req.params.slug.trim().toLowerCase();

        if (slug !== CABIN_SLUG) {
            return res.status(404).json({
                success: false,
                message: "Only the RAUDAH cabin is available."
            });
        }

        const cabin = await Cabin.findOneAndDelete({
            slug: CABIN_SLUG
        });

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "RAUDAH cabin deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// READ - Get all items from a section
// =====================================
const getSectionItems = async (req, res) => {
    try {
        const { section } = req.params;

        if (!SECTION_CONFIG[section]) {
            return res.status(400).json({
                success: false,
                message: "Invalid section name."
            });
        }

        const cabin = await findCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        res.status(200).json({
            success: true,
            section,
            count: cabin[section].length,
            data: cabin[section]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// CREATE - Add item to a section
// =====================================
const addSectionItem = async (req, res) => {
    try {
        const { section } = req.params;

        if (!SECTION_CONFIG[section]) {
            return res.status(400).json({
                success: false,
                message: "Invalid section name."
            });
        }

        const item = pickFields(req.body, SECTION_CONFIG[section]);

        if (Object.keys(item).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid item data."
            });
        }

        const cabin = await findCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        cabin[section].push(item);
        await cabin.save();

        const addedItem = cabin[section][cabin[section].length - 1];

        res.status(201).json({
            success: true,
            message: "Item added successfully!",
            data: addedItem
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// UPDATE - Update one section item
// =====================================
const updateSectionItem = async (req, res) => {
    try {
        const { section, itemId } = req.params;

        if (!SECTION_CONFIG[section]) {
            return res.status(400).json({
                success: false,
                message: "Invalid section name."
            });
        }

        const updates = pickFields(req.body, SECTION_CONFIG[section]);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid update fields provided."
            });
        }

        const cabin = await findCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        const item = cabin[section].id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Section item not found!"
            });
        }

        item.set(updates);
        await cabin.save();

        res.status(200).json({
            success: true,
            message: "Item updated successfully!",
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// DELETE - Delete one section item
// =====================================
const deleteSectionItem = async (req, res) => {
    try {
        const { section, itemId } = req.params;

        if (!SECTION_CONFIG[section]) {
            return res.status(400).json({
                success: false,
                message: "Invalid section name."
            });
        }

        const cabin = await findCabin();

        if (!cabin) {
            return res.status(404).json({
                success: false,
                message: "RAUDAH cabin not found!"
            });
        }

        const item = cabin[section].id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Section item not found!"
            });
        }

        item.deleteOne();
        await cabin.save();

        res.status(200).json({
            success: true,
            message: "Item deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCabin,
    getAllCabins,
    getCabinBySlug,
    updateCabin,
    deleteCabin,
    getSectionItems,
    addSectionItem,
    updateSectionItem,
    deleteSectionItem
};
