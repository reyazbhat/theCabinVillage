
const API_URL = "http://localhost:5000/api/cabins/raudah/gallery";
const API_ORIGIN = "http://localhost:5000";

const form = document.getElementById("gallery-form");
const addButton = document.getElementById("gallery-add-button");
const cancelButton = document.getElementById("gallery-cancel-button");
const filesInput = document.getElementById("gallery-files");
const previewGrid = document.getElementById("gallery-preview-grid");
const galleryList = document.getElementById("gallery-list");
const saveButton = document.getElementById("gallery-save-button");
const formMessage = document.getElementById("gallery-form-message");
const galleryStatus = document.getElementById("gallery-status");

let selectedPhotos = [];
let objectUrls = [];
let isUploading = false;

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? "#a13d32" : "inherit";
}

function getImageUrl(url) {
    if (!url) return "";

    if (url.startsWith("/uploads/")) {
        return `${API_ORIGIN}${url}`;
    }

    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            return parsed.href;
        }
    } catch {
        return "";
    }

    return "";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

// =====================================
// THEME SYSTEM
// =====================================

const THEME_MODE_KEY = "raudah-theme-mode";
const THEME_CHOICE_KEY = "raudah-theme-choice";

const themeToggle = document.getElementById("theme-toggle");
const themeMenu = document.getElementById("theme-menu");
const themeClose = document.getElementById("theme-close");
const themeStatus = document.getElementById("theme-status");

function getAutomaticTheme() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 8) return "sunrise";
    if (hour >= 8 && hour < 12) return "day";
    if (hour >= 12 && hour < 16) return "afternoon";
    if (hour >= 16 && hour < 19) return "sunset";
    return "night";
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.themeChoice === theme
        );
    });
}

function updateTheme() {
    const mode = localStorage.getItem(THEME_MODE_KEY) || "auto";
    const choice = localStorage.getItem(THEME_CHOICE_KEY) || "nature";

    if (mode === "auto") {
        applyTheme(getAutomaticTheme());

        if (themeStatus) {
            themeStatus.textContent = "Automatic mode is on.";
        }
    } else {
        applyTheme(choice);

        if (themeStatus) {
            themeStatus.textContent = `Manual theme: ${choice}.`;
        }
    }

    document.querySelectorAll("[data-mode]").forEach(button => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });
}

themeToggle?.addEventListener("click", () => {
    const isOpen = !themeMenu.hidden;
    themeMenu.hidden = isOpen;
    themeToggle.setAttribute("aria-expanded", String(!isOpen));
});

themeClose?.addEventListener("click", () => {
    themeMenu.hidden = true;
    themeToggle.setAttribute("aria-expanded", "false");
});

document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        localStorage.setItem(THEME_MODE_KEY, mode);

        if (mode === "auto") {
            localStorage.removeItem(THEME_CHOICE_KEY);
        }

        updateTheme();
    });
});

document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.addEventListener("click", () => {
        const choice = button.dataset.themeChoice;

        localStorage.setItem(THEME_MODE_KEY, "manual");
        localStorage.setItem(THEME_CHOICE_KEY, choice);

        updateTheme();
    });
});

updateTheme();
setInterval(() => {
    if (localStorage.getItem(THEME_MODE_KEY) !== "manual") {
        updateTheme();
    }
}, 60000);

// =====================================
// ADD PHOTO FORM
// =====================================

addButton.addEventListener("click", () => {
    form.hidden = !form.hidden;

    if (!form.hidden) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

function clearPreviews() {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
    previewGrid.innerHTML = "";
}

function resetUploadForm() {
    selectedPhotos = [];
    clearPreviews();
    filesInput.value = "";
    form.reset();
    showMessage(formMessage, "");
}

function closeUploadForm() {
    if (isUploading) return;

    resetUploadForm();
    form.hidden = true;
}

cancelButton.addEventListener("click", closeUploadForm);

function renderPreviews() {
    clearPreviews();

    selectedPhotos.forEach((photo, index) => {
        const card = document.createElement("div");
        card.className = "gallery-preview-card";

        const image = document.createElement("img");
        const previewUrl = URL.createObjectURL(photo.file);
        objectUrls.push(previewUrl);

        image.src = previewUrl;
        image.alt = `Selected photo ${index + 1}`;
        image.className = "gallery-preview-image";

        const label = document.createElement("label");
        label.textContent = `Photo ${index + 1} — Optional note`;

        const note = document.createElement("textarea");
        note.maxLength = 500;
        note.placeholder = "Write something about this memory...";
        note.value = photo.note;

        note.addEventListener("input", () => {
            selectedPhotos[index].note = note.value;
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "gallery-remove-button";
        removeButton.textContent = "✕ Remove Photo";

        removeButton.addEventListener("click", () => {
            selectedPhotos.splice(index, 1);
            renderPreviews();
        });

        card.append(image, label, note, removeButton);
        previewGrid.appendChild(card);
    });
}

filesInput.addEventListener("change", () => {
    const newFiles = Array.from(filesInput.files || []);

    if (selectedPhotos.length + newFiles.length > 20) {
        showMessage(formMessage, "Maximum 20 photos can be uploaded at once.", true);
        filesInput.value = "";
        return;
    }

    const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif"
    ];

    for (const file of newFiles) {
        if (!validTypes.includes(file.type)) {
            showMessage(formMessage, `${file.name} is not a supported image.`, true);
            filesInput.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showMessage(formMessage, `${file.name} exceeds the 10 MB limit.`, true);
            filesInput.value = "";
            return;
        }
    }

    newFiles.forEach(file => {
        selectedPhotos.push({ file, note: "" });
    });

    filesInput.value = "";
    showMessage(formMessage, "");
    renderPreviews();
});

// =====================================
// UPLOAD PHOTOS
// =====================================

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (isUploading) return;

    if (selectedPhotos.length === 0) {
        showMessage(formMessage, "Please select at least one photo.", true);
        return;
    }

    const formData = new FormData();

    selectedPhotos.forEach(photo => {
        formData.append("photos", photo.file);
    });

    formData.append(
        "notes",
        JSON.stringify(selectedPhotos.map(photo => photo.note.trim()))
    );

    try {
        isUploading = true;
        saveButton.disabled = true;
        saveButton.textContent = "Uploading...";
        showMessage(formMessage, "Uploading your photos...");

        const result = await apiRequest(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });

        showMessage(formMessage, result.message || "Photos uploaded!");

        resetUploadForm();
        form.hidden = true;

        await loadGallery();
    } catch (error) {
        showMessage(formMessage, error.message, true);
    } finally {
        isUploading = false;
        saveButton.disabled = false;
        saveButton.textContent = "Upload Photos";
    }
});

// =====================================
// DISPLAY GALLERY
// =====================================

function createGalleryCard(photo) {
    const card = document.createElement("article");
    card.className = "panel gallery-card";

    const image = document.createElement("img");
    image.className = "gallery-card-image";
    image.src = getImageUrl(photo.imageUrl);
    image.alt = photo.caption || "RAUDAH gallery memory";
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.alt = "Image could not be loaded";
    });

    const note = document.createElement("p");
    note.className = "gallery-card-note";
    note.textContent = photo.caption || "No note added.";

    const actions = document.createElement("div");
    actions.className = "gallery-card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "gallery-edit-button";
    editButton.textContent = "✏️ Edit Note";

    editButton.addEventListener("click", () => {
        editPhotoNote(photo);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "gallery-delete-button";
    deleteButton.textContent = "🗑️ Delete";

    deleteButton.addEventListener("click", () => {
        deletePhoto(photo._id, deleteButton);
    });

    actions.append(editButton, deleteButton);
    card.append(image, note, actions);

    return card;
}

async function loadGallery() {
    galleryList.innerHTML = '<p class="loading">Loading gallery...</p>';

    try {
        const result = await apiRequest(API_URL);
        galleryList.innerHTML = "";

        if (!result.data || result.data.length === 0) {
            const empty = document.createElement("div");
            empty.className = "panel gallery-empty";
            empty.textContent = "🖼️ Your gallery is waiting for its first memory. Add some photos!";
            galleryList.appendChild(empty);
            return;
        }

        const grid = document.createElement("div");
        grid.className = "gallery-grid";

        result.data.forEach(photo => {
            grid.appendChild(createGalleryCard(photo));
        });

        galleryList.appendChild(grid);
    } catch (error) {
        galleryList.innerHTML = "";
        showMessage(galleryStatus, error.message, true);
    }
}

// =====================================
// EDIT PHOTO NOTE
// =====================================

async function editPhotoNote(photo) {
    const updatedNote = prompt(
        "Edit the note for this photo. Leave blank if you want no note:",
        photo.caption || ""
    );

    if (updatedNote === null) return;

    try {
        await apiRequest(`${API_URL}/${photo._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                caption: updatedNote.trim()
            })
        });

        showMessage(galleryStatus, "Photo note updated successfully!");
        await loadGallery();
    } catch (error) {
        showMessage(galleryStatus, error.message, true);
    }
}

// =====================================
// DELETE PHOTO
// =====================================

async function deletePhoto(itemId, button) {
    const confirmed = confirm(
        "Are you sure you want to permanently delete this photo?"
    );

    if (!confirmed) return;

    try {
        button.disabled = true;
        button.textContent = "Deleting...";

        await apiRequest(`${API_URL}/${itemId}`, {
            method: "DELETE"
        });

        showMessage(galleryStatus, "Photo deleted successfully!");
        await loadGallery();
    } catch (error) {
        showMessage(galleryStatus, error.message, true);
        button.disabled = false;
        button.textContent = "🗑️ Delete";
    }
}

// =====================================
// INITIAL LOAD
// =====================================

loadGallery();
