
// ========================================
// RAUDAH PROJECTS - MONGODB CONNECTION
// ========================================

const API_URL = "http://localhost:5000/api/cabins/raudah/projects";

const projectsList = document.getElementById("projects-list");
const projectsStatus = document.getElementById("projects-status");

const addProjectButton = document.getElementById("add-project-button");
const projectForm = document.getElementById("project-form");
const projectFormHeading = document.getElementById("project-form-heading");
const saveProjectButton = document.getElementById("save-project-button");
const cancelProjectButton = document.getElementById("cancel-project-button");
const projectFormMessage = document.getElementById("project-form-message");

const projectTitleInput = document.getElementById("project-title");
const projectDescriptionInput = document.getElementById("project-description");
const projectImageInput = document.getElementById("project-image");
const projectLinkInput = document.getElementById("project-link");

let projects = [];
let editingProjectId = null;


// ========================================
// MESSAGE HELPERS
// ========================================

function showProjectMessage(message, isError = false) {
  if (!projectFormMessage) return;

  projectFormMessage.textContent = message;
  projectFormMessage.classList.toggle("error", isError);
}

function showProjectsStatus(message, isError = false) {
  if (!projectsStatus) return;

  projectsStatus.textContent = message;
  projectsStatus.classList.toggle("error", isError);
}


// ========================================
// API RESPONSE HELPER
// ========================================

async function getApiResult(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Something went wrong. Please try again."
    );
  }

  return result;
}


// ========================================
// LOAD PROJECTS FROM MONGODB
// ========================================

async function loadProjects() {
  if (!projectsList) return;

  projectsList.innerHTML =
    '<p class="loading">Loading projects...</p>';

  showProjectsStatus("");

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      cache: "no-cache"
    });

    const result = await getApiResult(response);

    projects = Array.isArray(result.data)
      ? result.data
      : [];

    renderProjects();

  } catch (error) {
    console.error("Projects loading error:", error);

    projectsList.innerHTML = "";

    showProjectsStatus(
      error.message || "Could not load projects. Please check your backend.",
      true
    );
  }
}


// ========================================
// DISPLAY PROJECTS
// ========================================

function renderProjects() {
  if (!projectsList) return;

  projectsList.innerHTML = "";

  if (projects.length === 0) {
    const emptyMessage = document.createElement("div");

    emptyMessage.className = "panel";
    emptyMessage.textContent =
      "No projects added yet. Click '+ Add Project' to create your first project.";

    projectsList.appendChild(emptyMessage);
    return;
  }

  projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "feature-card";

    const icon = document.createElement("span");
    icon.textContent = "🚀";
    card.appendChild(icon);

    const title = document.createElement("h3");
    title.textContent = project.title || "Untitled Project";
    card.appendChild(title);

    const description = document.createElement("p");
    description.textContent =
      project.description || "No description added.";

    card.appendChild(description);

    if (project.image) {
      const image = document.createElement("img");

      image.src = project.image;
      image.alt = project.title || "Project image";
      image.loading = "lazy";

      image.style.width = "100%";
      image.style.maxHeight = "190px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "12px";
      image.style.marginTop = "12px";

      image.addEventListener("error", () => {
        image.remove();
      });

      card.appendChild(image);
    }

    if (project.link) {
      const projectLink = document.createElement("a");

      projectLink.href = project.link;
      projectLink.target = "_blank";
      projectLink.rel = "noopener noreferrer";
      projectLink.textContent = "View Project ↗";

      projectLink.style.display = "inline-block";
      projectLink.style.marginTop = "12px";
      projectLink.style.color = "var(--heading-color)";
      projectLink.style.fontWeight = "600";

      card.appendChild(projectLink);
    }

    const actions = document.createElement("div");
    actions.className = "profile-form-actions";

    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "profile-edit-button";
    editButton.textContent = "✏️ Edit";

    editButton.addEventListener("click", () => {
      openProjectEditor(index);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "profile-cancel-button";
    deleteButton.textContent = "🗑️ Delete";

    deleteButton.addEventListener("click", () => {
      deleteProject(index);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(actions);
    projectsList.appendChild(card);
  });
}


// ========================================
// OPEN ADD PROJECT FORM
// ========================================

function openAddProjectForm() {
  if (!projectForm) return;

  editingProjectId = null;

  projectForm.reset();

  projectFormHeading.textContent = "Add New Project";
  saveProjectButton.textContent = "Save Project";

  showProjectMessage("");

  projectForm.hidden = false;
  addProjectButton.hidden = true;

  projectTitleInput.focus();
}


// ========================================
// OPEN EDIT PROJECT FORM
// ========================================

function openProjectEditor(index) {
  const project = projects[index];

  if (!project || !project._id) {
    showProjectsStatus("Could not identify this project.", true);
    return;
  }

  editingProjectId = project._id;

  projectTitleInput.value = project.title || "";
  projectDescriptionInput.value = project.description || "";
  projectImageInput.value = project.image || "";
  projectLinkInput.value = project.link || "";

  projectFormHeading.textContent = "Edit Project";
  saveProjectButton.textContent = "Update Project";

  showProjectMessage("");

  projectForm.hidden = false;
  addProjectButton.hidden = true;

  projectForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  projectTitleInput.focus();
}


// ========================================
// CLOSE PROJECT FORM
// ========================================

function closeProjectForm() {
  if (!projectForm) return;

  projectForm.reset();
  projectForm.hidden = true;

  addProjectButton.hidden = false;

  editingProjectId = null;

  showProjectMessage("");

  saveProjectButton.disabled = false;
  saveProjectButton.textContent = "Save Project";
}

if (addProjectButton) {
  addProjectButton.addEventListener("click", openAddProjectForm);
}

if (cancelProjectButton) {
  cancelProjectButton.addEventListener("click", closeProjectForm);
}


// ========================================
// SAVE / UPDATE PROJECT IN MONGODB
// ========================================

if (projectForm) {
  projectForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = projectTitleInput.value.trim();
    const description = projectDescriptionInput.value.trim();
    const image = projectImageInput.value.trim();
    const link = projectLinkInput.value.trim();

    if (!title) {
      showProjectMessage("Project title is required.", true);
      projectTitleInput.focus();
      return;
    }

    const projectData = {
      title,
      description,
      image,
      link
    };

    const isEditing = Boolean(editingProjectId);
    const itemId = editingProjectId;

    const requestUrl = isEditing
      ? `${API_URL}/${encodeURIComponent(itemId)}`
      : API_URL;

    const requestMethod = isEditing ? "PUT" : "POST";

    saveProjectButton.disabled = true;
    saveProjectButton.textContent = "Saving...";

    showProjectMessage("Saving project...");

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(projectData)
      });

      await getApiResult(response);

      await loadProjects();

      closeProjectForm();

      showProjectsStatus(
        isEditing
          ? "Project updated successfully!"
          : "Project saved successfully!"
      );

    } catch (error) {
      console.error("Project save error:", error);

      showProjectMessage(
        error.message || "Could not save project. Please try again.",
        true
      );

    } finally {
      saveProjectButton.disabled = false;
      saveProjectButton.textContent = isEditing
        ? "Update Project"
        : "Save Project";
    }
  });
}


// ========================================
// DELETE PROJECT FROM MONGODB
// ========================================

async function deleteProject(index) {
  const project = projects[index];

  if (!project || !project._id) {
    showProjectsStatus("Could not identify this project.", true);
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${project.title}"?`
  );

  if (!confirmed) return;

  showProjectsStatus("Deleting project...");

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(project._id)}`,
      {
        method: "DELETE"
      }
    );

    await getApiResult(response);

    await loadProjects();

    showProjectsStatus("Project deleted successfully!");

  } catch (error) {
    console.error("Project delete error:", error);

    showProjectsStatus(
      error.message || "Could not delete project. Please try again.",
      true
    );
  }
}


// ========================================
// RAUDAH THEME SYSTEM
// PRESERVE EXISTING THEME BEHAVIOUR
// ========================================

const themeToggle = document.getElementById("theme-toggle");
const themeMenu = document.getElementById("theme-menu");
const themeClose = document.getElementById("theme-close");
const themeStatus = document.getElementById("theme-status");

const themeModeButtons = document.querySelectorAll("[data-mode]");
const themeChoiceButtons = document.querySelectorAll("[data-theme-choice]");

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

let themeMode = "auto";
let selectedTheme = "nature";

function getAutomaticTheme(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 7) return "sunrise";
  if (hour >= 7 && hour < 12) return "day";
  if (hour >= 12 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 19) return "sunset";

  return "night";
}

function getThemeLabel(theme) {
  const labels = {
    sunrise: "Sunrise",
    day: "Day",
    afternoon: "Afternoon",
    sunset: "Sunset",
    night: "Night",
    fullmoon: "Full Moon",
    rain: "Rain",
    hot: "Hot Day",
    nature: "Nature"
  };

  return labels[theme] || "Nature";
}

function applyTheme(theme) {
  if (!validThemes.includes(theme)) {
    theme = "nature";
  }

  document.body.dataset.theme = theme;
  selectedTheme = theme;

  const themeColorMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColorMeta) {
    themeColorMeta.content = getComputedStyle(document.body)
      .getPropertyValue("--page-bg")
      .trim();
  }

  themeChoiceButtons.forEach(button => {
    const selected = button.dataset.themeChoice === theme;

    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  if (themeStatus) {
    themeStatus.textContent =
      themeMode === "auto"
        ? `Automatic mode · ${getThemeLabel(theme)} theme`
        : `Manual mode · ${getThemeLabel(theme)} selected`;
  }

  try {
    localStorage.setItem("raudah-theme-mode", themeMode);
    localStorage.setItem("raudah-selected-theme", selectedTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved.", error);
  }
}

function updateModeButtons() {
  themeModeButtons.forEach(button => {
    const active = button.dataset.mode === themeMode;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setThemeMode(mode) {
  themeMode = mode === "manual" ? "manual" : "auto";

  updateModeButtons();

  applyTheme(
    themeMode === "auto"
      ? getAutomaticTheme()
      : selectedTheme
  );
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
    if (themeMenu && themeMenu.hidden) {
      openThemeMenu();
    } else {
      closeThemeMenu();
    }
  });
}

if (themeClose) {
  themeClose.addEventListener("click", closeThemeMenu);
}

themeModeButtons.forEach(button => {
  button.addEventListener("click", () => {
    setThemeMode(button.dataset.mode);
  });
});

themeChoiceButtons.forEach(button => {
  button.addEventListener("click", () => {
    const chosenTheme = button.dataset.themeChoice;

    if (!validThemes.includes(chosenTheme)) return;

    themeMode = "manual";

    updateModeButtons();
    applyTheme(chosenTheme);
  });
});

document.addEventListener("click", event => {
  if (
    themeMenu &&
    themeToggle &&
    !themeMenu.hidden &&
    !themeMenu.contains(event.target) &&
    !themeToggle.contains(event.target)
  ) {
    closeThemeMenu();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeThemeMenu();
  }
});

function initializeTheme() {
  try {
    const savedMode = localStorage.getItem("raudah-theme-mode");
    const savedTheme = localStorage.getItem("raudah-selected-theme");

    themeMode = savedMode === "manual" ? "manual" : "auto";

    selectedTheme = validThemes.includes(savedTheme)
      ? savedTheme
      : "nature";

  } catch (error) {
    themeMode = "auto";
    selectedTheme = "nature";
  }

  updateModeButtons();

  applyTheme(
    themeMode === "auto"
      ? getAutomaticTheme()
      : selectedTheme
  );
}

function refreshAutomaticTheme() {
  if (themeMode === "auto") {
    applyTheme(getAutomaticTheme());
  }
}


// ========================================
// START PROJECTS PAGE
// ========================================

initializeTheme();
loadProjects();


// AUTOMATIC THEME CHECK EVERY MINUTE

setInterval(refreshAutomaticTheme, 60 * 1000);
