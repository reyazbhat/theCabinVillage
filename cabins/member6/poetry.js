
const API_URL = "http://localhost:5000/api/cabins/raudah/poetry";

const poetryList = document.getElementById("poetry-list");
const poetryForm = document.getElementById("poetry-form");
const addPoetryButton = document.getElementById("add-poetry-button");
const cancelPoetryButton = document.getElementById("cancel-poetry-button");
const poetryFormHeading = document.getElementById("poetry-form-heading");
const poetryFormMessage = document.getElementById("poetry-form-message");
const poetryStatus = document.getElementById("poetry-status");
const savePoetryButton = document.getElementById("save-poetry-button");

const titleInput = document.getElementById("poetry-title");
const contentInput = document.getElementById("poetry-content");

let editingPoetryId = null;
let poetryItems = [];

async function getApiResult(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }

  return result;
}

function showStatus(message, type = "") {
  if (!poetryStatus) return;
  poetryStatus.textContent = message;
  poetryStatus.dataset.state = type;
}

function showFormMessage(message, type = "") {
  if (!poetryFormMessage) return;
  poetryFormMessage.textContent = message;
  poetryFormMessage.dataset.state = type;
}

function openPoetryForm(item = null) {
  if (!poetryForm) return;

  editingPoetryId = item ? item._id : null;

  poetryFormHeading.textContent = item ? "Edit Poetry" : "Add New Poetry";
  savePoetryButton.textContent = item ? "Update Poetry" : "Save Poetry";

  titleInput.value = item ? item.title || "" : "";
  contentInput.value = item ? item.content || "" : "";

  showFormMessage("");
  poetryForm.hidden = false;
  titleInput.focus();

  poetryForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function closePoetryForm() {
  if (!poetryForm) return;

  poetryForm.reset();
  poetryForm.hidden = true;
  editingPoetryId = null;

  poetryFormHeading.textContent = "Add New Poetry";
  savePoetryButton.textContent = "Save Poetry";

  showFormMessage("");
}

function createPoetryCard(item) {
  const card = document.createElement("article");
  card.className = "panel poetry-card";

  const heading = document.createElement("h3");
  heading.textContent = `✍️ ${item.title || "Untitled Poetry"}`;

  const content = document.createElement("p");
  content.className = "poetry-content";
  content.textContent = item.content || "";
  content.style.whiteSpace = "pre-wrap";

  const actions = document.createElement("div");
  actions.className = "profile-form-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "profile-edit-button";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openPoetryForm(item));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "profile-cancel-button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deletePoetry(item._id));

  actions.append(editButton, deleteButton);
  card.append(heading, content, actions);

  return card;
}

function renderPoetry() {
  if (!poetryList) return;

  poetryList.replaceChildren();

  if (!poetryItems.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "loading";
    emptyMessage.textContent = "No poetry added yet. Start writing your first poem!";
    poetryList.appendChild(emptyMessage);
    return;
  }

  poetryItems.forEach(item => {
    poetryList.appendChild(createPoetryCard(item));
  });
}

async function loadPoetry() {
  if (!poetryList) return;

  poetryList.innerHTML = '<p class="loading">Loading poetry...</p>';
  showStatus("");

  try {
    const result = await getApiResult(API_URL);
    poetryItems = Array.isArray(result.data) ? result.data : [];
    renderPoetry();
  } catch (error) {
    poetryList.innerHTML = "";

    const errorMessage = document.createElement("p");
    errorMessage.className = "loading";
    errorMessage.textContent = `Could not load poetry: ${error.message}`;

    poetryList.appendChild(errorMessage);
    showStatus("Please check that the backend server is running.", "error");
  }
}

async function savePoetry(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    showFormMessage("Please enter both a title and your poetry.", "error");
    return;
  }

  const payload = { title, content };

  savePoetryButton.disabled = true;
  showFormMessage(editingPoetryId ? "Updating poetry..." : "Saving poetry...");

  try {
    if (editingPoetryId) {
      await getApiResult(`${API_URL}/${editingPoetryId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      showStatus("Poetry updated successfully.", "success");
    } else {
      await getApiResult(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showStatus("Your poetry has been saved.", "success");
    }

    closePoetryForm();
    await loadPoetry();
  } catch (error) {
    showFormMessage(error.message || "Could not save poetry.", "error");
  } finally {
    savePoetryButton.disabled = false;
  }
}

async function deletePoetry(itemId) {
  const confirmed = window.confirm("Are you sure you want to delete this poetry?");
  if (!confirmed) return;

  try {
    await getApiResult(`${API_URL}/${itemId}`, {
      method: "DELETE"
    });

    showStatus("Poetry deleted successfully.", "success");
    await loadPoetry();
  } catch (error) {
    showStatus(`Could not delete poetry: ${error.message}`, "error");
  }
}

if (addPoetryButton) {
  addPoetryButton.addEventListener("click", () => openPoetryForm());
}

if (cancelPoetryButton) {
  cancelPoetryButton.addEventListener("click", closePoetryForm);
}

if (poetryForm) {
  poetryForm.addEventListener("submit", savePoetry);
}

/* --------------------------------------------------
   RAUDAH THEME CONTROLS
-------------------------------------------------- */

const themeToggle = document.getElementById("theme-toggle");
const themeMenu = document.getElementById("theme-menu");
const themeClose = document.getElementById("theme-close");
const themeStatus = document.getElementById("theme-status");

const validThemes = [
  "sunrise",
  "day",
  "afternoon",
  "sunset",
  "night",
  "fullmoon",
  "rain",
  "hot",
  "nature"
];

const THEME_MODE_KEY = "raudah-theme-mode";
const THEME_CHOICE_KEY = "raudah-theme-choice";

let themeMode = localStorage.getItem(THEME_MODE_KEY) || "auto";
let manualTheme = localStorage.getItem(THEME_CHOICE_KEY) || "nature";

function getAutomaticTheme() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return "sunrise";
  if (hour >= 8 && hour < 12) return "day";
  if (hour >= 12 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 19) return "sunset";
  return "night";
}

function setTheme(theme) {
  if (!validThemes.includes(theme)) return;

  document.body.dataset.theme = theme;

  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const selected = button.dataset.themeChoice === theme;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateThemeStatus() {
  if (!themeStatus) return;

  themeStatus.textContent = themeMode === "auto"
    ? "Automatic mode is on. Theme follows your local time."
    : `Manual mode is on. Current theme: ${manualTheme}.`;
}

function updateModeButtons() {
  document.querySelectorAll("[data-mode]").forEach(button => {
    const selected = button.dataset.mode === themeMode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function applyCurrentTheme() {
  if (themeMode === "auto") {
    setTheme(getAutomaticTheme());
  } else {
    setTheme(manualTheme);
  }

  updateModeButtons();
  updateThemeStatus();
}

function chooseTheme(theme) {
  if (!validThemes.includes(theme)) return;

  themeMode = "manual";
  manualTheme = theme;

  localStorage.setItem(THEME_MODE_KEY, themeMode);
  localStorage.setItem(THEME_CHOICE_KEY, manualTheme);

  applyCurrentTheme();
}

function chooseMode(mode) {
  if (mode !== "auto" && mode !== "manual") return;

  themeMode = mode;

  if (mode === "manual" && !validThemes.includes(manualTheme)) {
    manualTheme = "nature";
  }

  localStorage.setItem(THEME_MODE_KEY, themeMode);
  localStorage.setItem(THEME_CHOICE_KEY, manualTheme);

  applyCurrentTheme();
}

function openThemeMenu() {
  if (!themeMenu || !themeToggle) return;

  themeMenu.hidden = false;
  themeToggle.setAttribute("aria-expanded", "true");
}

function closeThemeMenu() {
  if (!themeMenu || !themeToggle) return;

  themeMenu.hidden = true;
  themeToggle.setAttribute("aria-expanded", "false");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    if (themeMenu.hidden) {
      openThemeMenu();
    } else {
      closeThemeMenu();
    }
  });
}

if (themeClose) {
  themeClose.addEventListener("click", closeThemeMenu);
}

document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    chooseMode(button.dataset.mode);
  });
});

document.querySelectorAll("[data-theme-choice]").forEach(button => {
  button.addEventListener("click", () => {
    chooseTheme(button.dataset.themeChoice);
  });
});

document.addEventListener("click", event => {
  if (!themeMenu || !themeToggle || themeMenu.hidden) return;

  const clickedInsideMenu = themeMenu.contains(event.target);
  const clickedToggle = themeToggle.contains(event.target);

  if (!clickedInsideMenu && !clickedToggle) {
    closeThemeMenu();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeThemeMenu();
  }
});

applyCurrentTheme();

// Automatic theme follows local time while automatic mode is selected.
setInterval(() => {
  if (themeMode === "auto") {
    applyCurrentTheme();
  }
}, 60000);

/* Load saved poetry when the page opens. */
loadPoetry();
