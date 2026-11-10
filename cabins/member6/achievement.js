
const API_URL = "http://localhost:5000/api/cabins/raudah/achievements";

const achievementsList = document.getElementById("achievements-list");
const achievementForm = document.getElementById("achievement-form");
const addAchievementButton = document.getElementById("add-achievement-button");
const cancelAchievementButton = document.getElementById("cancel-achievement-button");
const achievementFormHeading = document.getElementById("achievement-form-heading");
const achievementFormMessage = document.getElementById("achievement-form-message");
const achievementsStatus = document.getElementById("achievements-status");
const saveAchievementButton = document.getElementById("save-achievement-button");

const titleInput = document.getElementById("achievement-title");
const descriptionInput = document.getElementById("achievement-description");
const dateInput = document.getElementById("achievement-date");

let editingAchievementId = null;
let achievements = [];

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
  achievementsStatus.textContent = message;
  achievementsStatus.dataset.state = type;
}

function showFormMessage(message, type = "") {
  achievementFormMessage.textContent = message;
  achievementFormMessage.dataset.state = type;
}

function openAchievementForm(item = null) {
  editingAchievementId = item ? item._id : null;

  achievementFormHeading.textContent = item
    ? "Edit Achievement"
    : "Add New Achievement";

  saveAchievementButton.textContent = item
    ? "Update Achievement"
    : "Save Achievement";

  titleInput.value = item ? item.title || "" : "";
  descriptionInput.value = item ? item.description || "" : "";
  dateInput.value = item ? item.date || "" : "";

  showFormMessage("");
  achievementForm.hidden = false;
  titleInput.focus();

  achievementForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function closeAchievementForm() {
  achievementForm.reset();
  achievementForm.hidden = true;
  editingAchievementId = null;

  achievementFormHeading.textContent = "Add New Achievement";
  saveAchievementButton.textContent = "Save Achievement";

  showFormMessage("");
}

function formatDate(dateString) {
  if (!dateString) return "Date not added";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function createAchievementCard(item) {
  const card = document.createElement("article");
  card.className = "panel achievement-card";

  const heading = document.createElement("h3");
  heading.textContent = `🏆 ${item.title || "Untitled Achievement"}`;

  const date = document.createElement("p");
  date.className = "achievement-date";
  date.textContent = `📅 ${formatDate(item.date)}`;

  const description = document.createElement("p");
  description.className = "achievement-description";
  description.textContent = item.description || "No description added.";
  description.style.whiteSpace = "pre-wrap";

  const actions = document.createElement("div");
  actions.className = "profile-form-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "profile-edit-button";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openAchievementForm(item));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "profile-cancel-button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteAchievement(item._id));

  actions.append(editButton, deleteButton);
  card.append(heading, date, description, actions);

  return card;
}

function renderAchievements() {
  achievementsList.replaceChildren();

  if (!achievements.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "loading";
    emptyMessage.textContent =
      "No achievements added yet. Celebrate your first milestone here!";
    achievementsList.appendChild(emptyMessage);
    return;
  }

  achievements.forEach(item => {
    achievementsList.appendChild(createAchievementCard(item));
  });
}

async function loadAchievements() {
  achievementsList.innerHTML =
    '<p class="loading">Loading achievements...</p>';

  showStatus("");

  try {
    const result = await getApiResult(API_URL);
    achievements = Array.isArray(result.data) ? result.data : [];
    renderAchievements();
  } catch (error) {
    achievementsList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "loading";
    errorMessage.textContent =
      `Could not load achievements: ${error.message}`;

    achievementsList.appendChild(errorMessage);
    showStatus("Please check that the backend server is running.", "error");
  }
}

async function saveAchievement(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const date = dateInput.value;

  if (!title) {
    showFormMessage("Please enter an achievement title.", "error");
    return;
  }

  const payload = { title, description, date };

  saveAchievementButton.disabled = true;

  showFormMessage(
    editingAchievementId
      ? "Updating achievement..."
      : "Saving achievement..."
  );

  try {
    if (editingAchievementId) {
      await getApiResult(`${API_URL}/${editingAchievementId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      showStatus("Achievement updated successfully.", "success");
    } else {
      await getApiResult(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showStatus("Achievement saved successfully.", "success");
    }

    closeAchievementForm();
    await loadAchievements();
  } catch (error) {
    showFormMessage(error.message || "Could not save achievement.", "error");
  } finally {
    saveAchievementButton.disabled = false;
  }
}

async function deleteAchievement(itemId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this achievement?"
  );

  if (!confirmed) return;

  try {
    await getApiResult(`${API_URL}/${itemId}`, {
      method: "DELETE"
    });

    showStatus("Achievement deleted successfully.", "success");
    await loadAchievements();
  } catch (error) {
    showStatus(`Could not delete achievement: ${error.message}`, "error");
  }
}

addAchievementButton.addEventListener("click", () => openAchievementForm());
cancelAchievementButton.addEventListener("click", closeAchievementForm);
achievementForm.addEventListener("submit", saveAchievement);

/* --------------------------------------------------
   RAUDAH THEME CONTROLS
-------------------------------------------------- */

const themeToggle = document.getElementById("theme-toggle");
const themeMenu = document.getElementById("theme-menu");
const themeClose = document.getElementById("theme-close");
const themeStatus = document.getElementById("theme-status");

const validThemes = [
  "sunrise", "day", "afternoon", "sunset", "night",
  "fullmoon", "rain", "hot", "nature"
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
  button.addEventListener("click", () => chooseMode(button.dataset.mode));
});

document.querySelectorAll("[data-theme-choice]").forEach(button => {
  button.addEventListener("click", () => chooseTheme(button.dataset.themeChoice));
});

document.addEventListener("click", event => {
  if (!themeMenu || !themeToggle || themeMenu.hidden) return;

  if (!themeMenu.contains(event.target) && !themeToggle.contains(event.target)) {
    closeThemeMenu();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeThemeMenu();
});

applyCurrentTheme();

setInterval(() => {
  if (themeMode === "auto") applyCurrentTheme();
}, 60000);

/* Load achievements from MongoDB. */
loadAchievements();
