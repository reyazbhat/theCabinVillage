
const API_URL = "http://localhost:5000/api/cabins/raudah/skills";

const skillsList = document.getElementById("skills-list");
const skillForm = document.getElementById("skill-form");
const addSkillButton = document.getElementById("add-skill-button");
const cancelSkillButton = document.getElementById("cancel-skill-button");
const skillFormHeading = document.getElementById("skill-form-heading");
const skillFormMessage = document.getElementById("skill-form-message");
const skillsStatus = document.getElementById("skills-status");
const saveSkillButton = document.getElementById("save-skill-button");

const nameInput = document.getElementById("skill-name");
const levelInput = document.getElementById("skill-level");

const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

let editingSkillId = null;
let skills = [];

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
  if (!skillsStatus) return;
  skillsStatus.textContent = message;
  skillsStatus.dataset.state = type;
}

function showFormMessage(message, type = "") {
  if (!skillFormMessage) return;
  skillFormMessage.textContent = message;
  skillFormMessage.dataset.state = type;
}

function openSkillForm(skill = null) {
  editingSkillId = skill ? skill._id : null;

  skillFormHeading.textContent = skill ? "Edit Skill" : "Add New Skill";
  saveSkillButton.textContent = skill ? "Update Skill" : "Save Skill";

  nameInput.value = skill ? skill.name || "" : "";
  levelInput.value = skill ? skill.level || "" : "";

  showFormMessage("");
  skillForm.hidden = false;

  nameInput.focus();

  skillForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function closeSkillForm() {
  skillForm.reset();
  skillForm.hidden = true;
  editingSkillId = null;

  skillFormHeading.textContent = "Add New Skill";
  saveSkillButton.textContent = "Save Skill";

  showFormMessage("");
}

function getLevelIcon(level) {
  const icons = {
    Beginner: "🌱",
    Intermediate: "🌿",
    Advanced: "⚡",
    Expert: "🏆"
  };

  return icons[level] || "✨";
}

function createSkillCard(skill) {
  const card = document.createElement("article");
  card.className = "panel skill-card";

  const heading = document.createElement("h3");
  heading.textContent = `${getLevelIcon(skill.level)} ${skill.name || "Untitled Skill"}`;

  const level = document.createElement("p");
  level.className = "skill-level";
  level.textContent = `Proficiency: ${skill.level || "Not specified"}`;

  const actions = document.createElement("div");
  actions.className = "profile-form-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "profile-edit-button";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openSkillForm(skill));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "profile-cancel-button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteSkill(skill._id));

  actions.append(editButton, deleteButton);
  card.append(heading, level, actions);

  return card;
}

function renderSkills() {
  skillsList.replaceChildren();

  if (!skills.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "loading";
    emptyMessage.textContent = "No skills added yet. Add your first skill and start your learning journey!";
    skillsList.appendChild(emptyMessage);
    return;
  }

  skills.forEach(skill => {
    skillsList.appendChild(createSkillCard(skill));
  });
}

async function loadSkills() {
  skillsList.innerHTML = '<p class="loading">Loading skills...</p>';
  showStatus("");

  try {
    const result = await getApiResult(API_URL);
    skills = Array.isArray(result.data) ? result.data : [];
    renderSkills();
  } catch (error) {
    skillsList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "loading";
    errorMessage.textContent = `Could not load skills: ${error.message}`;

    skillsList.appendChild(errorMessage);
    showStatus("Please check that the backend server is running.", "error");
  }
}

async function saveSkill(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const level = levelInput.value;

  if (!name || !validLevels.includes(level)) {
    showFormMessage("Please enter a skill name and select a valid proficiency level.", "error");
    return;
  }

  const payload = { name, level };

  saveSkillButton.disabled = true;
  showFormMessage(editingSkillId ? "Updating skill..." : "Saving skill...");

  try {
    if (editingSkillId) {
      await getApiResult(`${API_URL}/${editingSkillId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      showStatus("Skill updated successfully.", "success");
    } else {
      await getApiResult(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showStatus("New skill saved successfully.", "success");
    }

    closeSkillForm();
    await loadSkills();
  } catch (error) {
    showFormMessage(error.message || "Could not save skill.", "error");
  } finally {
    saveSkillButton.disabled = false;
  }
}

async function deleteSkill(skillId) {
  const confirmed = window.confirm("Are you sure you want to delete this skill?");
  if (!confirmed) return;

  try {
    await getApiResult(`${API_URL}/${skillId}`, {
      method: "DELETE"
    });

    showStatus("Skill deleted successfully.", "success");
    await loadSkills();
  } catch (error) {
    showStatus(`Could not delete skill: ${error.message}`, "error");
  }
}

addSkillButton.addEventListener("click", () => openSkillForm());

cancelSkillButton.addEventListener("click", closeSkillForm);

skillForm.addEventListener("submit", saveSkill);

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

setInterval(() => {
  if (themeMode === "auto") {
    applyCurrentTheme();
  }
}, 60000);

/* Load saved skills when the page opens. */
loadSkills();
