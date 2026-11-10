
const API_URL = "http://localhost:5000/api/cabins/raudah/diary";
const PAGE_SEPARATOR = "\n<!--RAUDAH_DIARY_PAGE_BREAK-->\n";

const pageList = document.getElementById("diary-page-list");
const editor = document.getElementById("diary-editor");
const message = document.getElementById("diary-message");
const newPageButton = document.getElementById("new-page-button");

let diaryPages = [];
let currentPageId = null;
let isNewStory = false;
let storySheets = [""];
let currentSheet = 0;
let originalStory = null;

if (newPageButton) {
    newPageButton.textContent = "＋ New Book";
}

function todayDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#a65f56" : "inherit";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

function splitStory(content = "") {
    if (content.includes(PAGE_SEPARATOR)) {
        return content.split(PAGE_SEPARATOR);
    }

    return [content];
}

function combineStory() {
    return storySheets.join(PAGE_SEPARATOR);
}

async function loadPages() {
    pageList.innerHTML = "<p>Loading your bookshelf...</p>";

    try {
        const result = await apiRequest(API_URL);
        diaryPages = Array.isArray(result.data) ? result.data : [];

        diaryPages.sort((a, b) => {
            return new Date(b.date || b.createdAt || 0) -
                   new Date(a.date || a.createdAt || 0);
        });

        renderPageList();

        // Never open a saved book automatically.
        showBlankPaper();

    } catch (error) {
        pageList.innerHTML = "<p>Could not load your books.</p>";
        showMessage(error.message, true);
    }
}

function renderPageList() {
    if (diaryPages.length === 0) {
        pageList.innerHTML = "<p>Your bookshelf is empty. Create your first book!</p>";
        return;
    }

    pageList.innerHTML = diaryPages.map((story, index) => `
        <button
            type="button"
            class="diary-page-item ${story._id === currentPageId && !isNewStory ? "active" : ""}"
            data-story-id="${escapeHTML(story._id)}"
        >
            <strong>${escapeHTML(story.title || `Untitled Book ${index + 1}`)}</strong>
            <small>📅 ${escapeHTML(story.date || "No date")}</small>
        </button>
    `).join("");

    pageList.querySelectorAll("[data-story-id]").forEach(button => {
        button.addEventListener("click", () => {
            if (!confirmLeaveUnsaved()) return;
            openStory(button.dataset.storyId);
        });
    });
}

function confirmLeaveUnsaved() {
    if (!isNewStory && originalStory) {
        const title = document.getElementById("story-title")?.value || "";
        const date = document.getElementById("story-date")?.value || "";
        const content = combineStory();

        if (
            title !== originalStory.title ||
            date !== originalStory.date ||
            content !== originalStory.content
        ) {
            return confirm("You have unsaved changes. Leave this book?");
        }
    }

    if (isNewStory) {
        const title = document.getElementById("story-title")?.value.trim() || "";
        const content = combineStory().trim();

        if (title || content) {
            return confirm("This new book has not been saved. Leave it?");
        }
    }

    return true;
}

function showBlankPaper() {
    currentPageId = null;
    isNewStory = false;
    originalStory = null;
    storySheets = [""];
    currentSheet = 0;

    renderPageList();

    // Keep the paper empty until a book is selected or created.
    editor.innerHTML = "";

    showMessage("");
}

function createNewStory() {
    if (!confirmLeaveUnsaved()) return;

    currentPageId = null;
    isNewStory = true;
    originalStory = null;
    storySheets = [""];
    currentSheet = 0;

    renderPageList();
    renderStoryEditor(true);

    showMessage("Your new book is ready. Write your story!");
    document.getElementById("story-title").focus();
}

function openStory(storyId) {
    const story = diaryPages.find(item => item._id === storyId);
    if (!story) return;

    currentPageId = storyId;
    isNewStory = false;

    storySheets = splitStory(story.content || "");
    if (storySheets.length === 0) storySheets = [""];

    currentSheet = 0;

    originalStory = {
        title: story.title || "",
        date: story.date || "",
        content: story.content || ""
    };

    renderPageList();
    renderStoryEditor(false);

    showMessage("Book opened. You can read or edit its pages.");
}

function renderStoryEditor(isNew) {
    const story = isNew
        ? { title: "", date: todayDate() }
        : diaryPages.find(item => item._id === currentPageId);

    if (!story) return;

    const sheetCount = storySheets.length;

    editor.innerHTML = `
        <input
            id="story-title"
            type="text"
            maxlength="150"
            value="${escapeHTML(story.title || "")}"
            placeholder="Give your book a title..."
        >

        <label for="story-date">Date</label>
        <input
            id="story-date"
            type="date"
            value="${escapeHTML(story.date || todayDate())}"
        >

        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin:15px 0 8px;">
            <strong style="font-family:Georgia,serif;">
                📖 Page <span id="sheet-number">${currentSheet + 1}</span>
            </strong>
            <span id="sheet-count" style="font-size:.85rem; opacity:.7;">of ${sheetCount}</span>
        </div>

        <textarea
            id="story-content"
            placeholder="Write your story here..."
        ></textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button id="previous-sheet" class="diary-action-button secondary" type="button">
                ← Previous
            </button>
            <button id="next-sheet" class="diary-action-button" type="button">
                Next Page →
            </button>
        </div>

        <div class="diary-actions">
            <button id="save-story" class="diary-action-button" type="button">
                💾 ${isNew ? "Save Book" : "Update Book"}
            </button>
            ${isNew ? `
                <button id="cancel-story" class="diary-action-button secondary" type="button">
                    Cancel
                </button>
            ` : `
                <button id="delete-story" class="diary-action-button danger" type="button">
                    🗑️ Delete Book
                </button>
            `}
        </div>
    `;

    document.getElementById("story-content").value = storySheets[currentSheet] || "";

    document.getElementById("previous-sheet").addEventListener("click", () => {
        saveCurrentSheet();

        if (currentSheet > 0) {
            currentSheet--;
            updateSheetDisplay();
        }
    });

    document.getElementById("next-sheet").addEventListener("click", () => {
        saveCurrentSheet();

        if (currentSheet === storySheets.length - 1) {
            storySheets.push("");
        }

        currentSheet++;
        updateSheetDisplay();
    });

    document.getElementById("save-story").addEventListener("click", saveStory);

    if (isNew) {
        document.getElementById("cancel-story").addEventListener("click", () => {
            if (confirm("Discard this unsaved book?")) {
                showBlankPaper();
            }
        });
    } else {
        document.getElementById("delete-story").addEventListener("click", deleteStory);
    }

    updateSheetDisplay();
}

function saveCurrentSheet() {
    const textarea = document.getElementById("story-content");

    if (textarea) {
        storySheets[currentSheet] = textarea.value;
    }
}

function updateSheetDisplay() {
    const textarea = document.getElementById("story-content");
    if (!textarea) return;

    textarea.value = storySheets[currentSheet] || "";

    document.getElementById("sheet-number").textContent = currentSheet + 1;
    document.getElementById("sheet-count").textContent = `of ${storySheets.length}`;

    const previousButton = document.getElementById("previous-sheet");
    previousButton.disabled = currentSheet === 0;
    previousButton.style.opacity = currentSheet === 0 ? ".45" : "1";
}

async function saveStory() {
    saveCurrentSheet();

    const title = document.getElementById("story-title").value.trim();
    const date = document.getElementById("story-date").value;
    const content = combineStory();

    if (!title) {
        showMessage("Please give your book a title.", true);
        document.getElementById("story-title").focus();
        return;
    }

    if (!content.trim()) {
        showMessage("Write something before saving your book.", true);
        document.getElementById("story-content").focus();
        return;
    }

    const saveButton = document.getElementById("save-story");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const bookData = { title, date, content };

        if (isNewStory) {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(bookData)
            });
        } else {
            await apiRequest(`${API_URL}/${currentPageId}`, {
                method: "PUT",
                body: JSON.stringify(bookData)
            });
        }

        showMessage("Your book has been saved successfully. ❤️");

        // Refresh bookshelf and leave the writing paper blank.
        await loadPages();

        showMessage("Book saved! Your paper is ready for another book.");

    } catch (error) {
        showMessage(error.message, true);
        saveButton.disabled = false;
        saveButton.textContent = isNewStory ? "💾 Save Book" : "💾 Update Book";
    }
}

async function deleteStory() {
    if (!currentPageId) return;

    if (!confirm("Delete this complete book and all its pages?")) return;

    try {
        await apiRequest(`${API_URL}/${currentPageId}`, {
            method: "DELETE"
        });

        showMessage("Book deleted.");
        await loadPages();

    } catch (error) {
        showMessage(error.message, true);
    }
}

newPageButton.addEventListener("click", createNewStory);

/* Theme controls */
(function setupTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const themeMenu = document.getElementById("theme-menu");
    const themeClose = document.getElementById("theme-close");
    const themeStatus = document.getElementById("theme-status");

    const modeKey = "raudah-theme-mode";
    const choiceKey = "raudah-theme-choice";

    let mode = localStorage.getItem(modeKey) || "auto";
    let manualChoice = localStorage.getItem(choiceKey) || "day";

    function automaticTheme() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 7) return "sunrise";
        if (hour >= 7 && hour < 12) return "day";
        if (hour >= 12 && hour < 16) return "afternoon";
        if (hour >= 16 && hour < 19) return "sunset";
        return "night";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);

        document.querySelectorAll("[data-theme-choice]").forEach(button => {
            button.classList.toggle("active", button.dataset.themeChoice === theme);
        });

        document.querySelectorAll("[data-mode]").forEach(button => {
            button.classList.toggle("active", button.dataset.mode === mode);
        });

        if (themeStatus) {
            themeStatus.textContent = mode === "auto"
                ? "Automatic theme is on."
                : `Manual theme: ${theme}.`;
        }
    }

    function refreshTheme() {
        applyTheme(mode === "auto" ? automaticTheme() : manualChoice);
    }

    themeToggle?.addEventListener("click", () => {
        themeMenu.hidden = !themeMenu.hidden;
    });

    themeClose?.addEventListener("click", () => {
        themeMenu.hidden = true;
    });

    document.querySelectorAll("[data-mode]").forEach(button => {
        button.addEventListener("click", () => {
            mode = button.dataset.mode;
            localStorage.setItem(modeKey, mode);
            refreshTheme();
        });
    });

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.addEventListener("click", () => {
            manualChoice = button.dataset.themeChoice;
            mode = "manual";

            localStorage.setItem(modeKey, mode);
            localStorage.setItem(choiceKey, manualChoice);

            refreshTheme();
        });
    });

    refreshTheme();

    setInterval(() => {
        if (mode === "auto") refreshTheme();
    }, 60000);
})();

loadPages();
