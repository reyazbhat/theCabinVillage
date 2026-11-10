// ========================================
// RAUDAH - CABIN INFORMATION
// ========================================

async function loadCabin() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/cabins/raudah",
      { cache: "no-cache" }
    );

    if (!response.ok) {
      throw new Error("Could not load cabin from backend");
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error("Invalid cabin data received");
    }

    const cabin = result.data;

    document.title = `${cabin.cabinTitle || "RAUDAH"} | The Cabin Village`;

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    // HERO
    setText("icon", cabin.icon || "🥰");
    setText("title", cabin.cabinTitle || "RAUDAH");
    setText("owner", `Resident: ${cabin.owner || "Not added yet"}`);

    // CABIN INFO
    setText("info-owner", cabin.owner || "Not added yet");
    setText("info-title", cabin.cabinTitle || "RAUDAH");
    setText("info-phone", cabin.phoneNumber || "Not added yet");
    setText("info-email", cabin.email || "Not added yet");

  } catch (error) {
    console.error("RAUDAH backend error:", error);

    const owner = document.getElementById("owner");
    const infoOwner = document.getElementById("info-owner");

    if (owner) owner.textContent = "Resident: Md Ehtesham";
    if (infoOwner) infoOwner.textContent = "Md Ehtesham";
  }
}


// ========================================
// ACTIVE SIDEBAR LINK
// ========================================

const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");

function setActiveNav() {
  const hash = location.hash || "#top";

  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}

window.addEventListener("hashchange", setActiveNav);


// ========================================
// CALENDAR
// ========================================

const calendarElement = document.getElementById("calendar");
const monthYearElement = document.getElementById("month-year");

let currentMonth = new Date();
currentMonth = new Date(
  currentMonth.getFullYear(),
  currentMonth.getMonth(),
  1
);

function renderCalendar() {
  if (!calendarElement || !monthYearElement) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  monthYearElement.textContent = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  calendarElement.innerHTML = "";

  // WEEKDAY HEADINGS
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
    const heading = document.createElement("div");
    heading.textContent = day;
    heading.className = "day-name";
    calendarElement.appendChild(heading);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // EMPTY SPACES BEFORE FIRST DATE
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "empty-day";
    calendarElement.appendChild(empty);
  }

  // MONTH DATES
  for (let day = 1; day <= totalDays; day++) {
    const dateCell = document.createElement("div");
    dateCell.textContent = day;

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dateCell.className = "today";
      dateCell.setAttribute("aria-label", `Today, ${day}`);
    }

    calendarElement.appendChild(dateCell);
  }
}

document.getElementById("prev-month")?.addEventListener("click", () => {
  currentMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() - 1,
    1
  );

  renderCalendar();
});

document.getElementById("next-month")?.addEventListener("click", () => {
  currentMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    1
  );

  renderCalendar();
});


// ========================================
// LIVE CLASSICAL ANALOG CLOCK
// ========================================

function updateAnalogClock() {
  const now = new Date();

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHand = document.getElementById("second-hand");
  const digital = document.getElementById("clock-digital");
  const clockDate = document.getElementById("clock-date");

  if (hourHand) {
    const hourRotation = (hours % 12) * 30 + minutes * 0.5;
    hourHand.style.transform =
      `translateX(-50%) rotate(${hourRotation}deg)`;
  }

  if (minuteHand) {
    const minuteRotation = minutes * 6 + seconds * 0.1;
    minuteHand.style.transform =
      `translateX(-50%) rotate(${minuteRotation}deg)`;
  }

  if (secondHand) {
    secondHand.style.transform =
      `translateX(-50%) rotate(${seconds * 6}deg)`;
  }

  if (digital) {
    digital.textContent = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }

  if (clockDate) {
    clockDate.textContent = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}


// ========================================
// RAUDAH THEME SYSTEM
// AUTOMATIC + MANUAL
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


// AUTOMATIC THEME ACCORDING TO LOCAL TIME
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


// APPLY THEME
function applyTheme(theme) {
  if (!validThemes.includes(theme)) {
    theme = "nature";
  }

  document.body.dataset.theme = theme;
  selectedTheme = theme;

  // BROWSER BAR COLOR (MOBILE)
  const themeColorMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColorMeta) {
    themeColorMeta.content =
      getComputedStyle(document.body)
        .getPropertyValue("--page-bg")
        .trim();
  }

  // SELECTED THEME BUTTON
  themeChoiceButtons.forEach(button => {
    const isSelected = button.dataset.themeChoice === theme;

    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  // STATUS TEXT
  if (themeStatus) {
    themeStatus.textContent =
      themeMode === "auto"
        ? `Automatic mode · ${getThemeLabel(theme)} theme`
        : `Manual mode · ${getThemeLabel(theme)} selected`;
  }

  // SAVE THEME PREFERENCE
  try {
    localStorage.setItem("raudah-theme-mode", themeMode);
    localStorage.setItem("raudah-selected-theme", selectedTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved.", error);
  }
}


// MARK ACTIVE MODE BUTTON
function updateModeButtons() {
  themeModeButtons.forEach(button => {
    const active = button.dataset.mode === themeMode;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}


// CHANGE THEME MODE
function setThemeMode(mode) {
  themeMode = mode === "manual" ? "manual" : "auto";

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


// THEME TOGGLE BUTTON
themeToggle?.addEventListener("click", () => {
  if (!themeMenu) return;

  if (themeMenu.hidden) {
    openThemeMenu();
  } else {
    closeThemeMenu();
  }
});

themeClose?.addEventListener("click", closeThemeMenu);


// AUTOMATIC / MANUAL BUTTONS
themeModeButtons.forEach(button => {
  button.addEventListener("click", () => {
    setThemeMode(button.dataset.mode);
  });
});


// SELECTING A THEME SWITCHES TO MANUAL MODE
themeChoiceButtons.forEach(button => {
  button.addEventListener("click", () => {
    const chosenTheme = button.dataset.themeChoice;

    if (!validThemes.includes(chosenTheme)) return;

    themeMode = "manual";

    updateModeButtons();
    applyTheme(chosenTheme);
  });
});


// CLICK OUTSIDE CLOSES MENU
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


// ESCAPE CLOSES MENU
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeThemeMenu();
  }
});


// LOAD SAVED THEME
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


// ========================================
// RAUDAH PROFILE EDIT + MONGODB UPDATE
// ========================================

const profileEditButton = document.getElementById(
  "edit-profile-button"
);

const profileEditForm = document.getElementById(
  "profile-edit-form"
);

const profileCancelButton = document.getElementById(
  "cancel-profile-button"
);

const profileMessage = document.getElementById(
  "profile-form-message"
);

const saveProfileButton = document.getElementById(
  "save-profile-button"
);


function showProfileMessage(message, isError = false) {
  if (!profileMessage) return;

  profileMessage.textContent = message;
  profileMessage.classList.toggle("error", isError);
}


// OPEN EDIT PROFILE FORM
function openProfileEditor() {
  if (!profileEditForm) return;

  const ownerText =
    document.getElementById("info-owner")?.textContent || "";

  const phoneText =
    document.getElementById("info-phone")?.textContent || "";

  const emailText =
    document.getElementById("info-email")?.textContent || "";

  document.getElementById("edit-owner").value =
    ownerText === "Not added yet" ? "" : ownerText;

  document.getElementById("edit-phone").value =
    phoneText === "Not added yet" ? "" : phoneText;

  document.getElementById("edit-email").value =
    emailText === "Not added yet" ? "" : emailText;

  showProfileMessage("");

  profileEditForm.hidden = false;
  profileEditButton.hidden = true;

  document.getElementById("edit-owner").focus();
}


// CLOSE EDIT PROFILE FORM
function closeProfileEditor() {
  if (!profileEditForm) return;

  profileEditForm.reset();
  profileEditForm.hidden = true;
  profileEditButton.hidden = false;

  showProfileMessage("");
}


profileEditButton?.addEventListener("click", openProfileEditor);

profileCancelButton?.addEventListener(
  "click",
  closeProfileEditor
);


// SAVE PROFILE TO MONGODB
profileEditForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const owner = document.getElementById("edit-owner").value.trim();
  const phoneNumber = document.getElementById("edit-phone").value.trim();
  const email = document.getElementById("edit-email").value.trim();

  if (!owner) {
    showProfileMessage("Owner name is required.", true);
    document.getElementById("edit-owner").focus();
    return;
  }

  saveProfileButton.disabled = true;
  saveProfileButton.textContent = "Saving...";

  showProfileMessage("Saving your profile...");

  try {
    const response = await fetch(
      "http://localhost:5000/api/cabins/raudah",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          owner,
          phoneNumber,
          email
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(
        result.message || "Could not save profile changes."
      );
    }

    const cabin = result.data;

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    // UPDATE PAGE WITHOUT REFRESH
    setText("info-owner", cabin.owner || "Not added yet");
    setText("info-title", cabin.cabinTitle || "RAUDAH");
    setText("info-phone", cabin.phoneNumber || "Not added yet");
    setText("info-email", cabin.email || "Not added yet");

    setText(
      "owner",
      `Resident: ${cabin.owner || "Not added yet"}`
    );

    showProfileMessage("Profile updated successfully!");

  } catch (error) {
    console.error("Profile update error:", error);

    showProfileMessage(
      error.message || "Something went wrong. Please try again.",
      true
    );

  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Save Changes";
  }
});


// ========================================
// START EVERYTHING
// ========================================

setActiveNav();
loadCabin();
renderCalendar();
updateAnalogClock();
initializeTheme();


// CLOCK EVERY SECOND
setInterval(updateAnalogClock, 1000);


// CHECK AUTOMATIC THEME EVERY MINUTE
setInterval(refreshAutomaticTheme, 60 * 1000);