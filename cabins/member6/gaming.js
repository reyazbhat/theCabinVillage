
const API_URL = "http://localhost:5000/api/cabins/raudah/gaming";

const form = document.getElementById("gaming-form");
const gameNameInput = document.getElementById("game-name");
const gameRankInput = document.getElementById("game-rank");
const gameDetailsInput = document.getElementById("game-details");
const gamingList = document.getElementById("gaming-list");
const gamingMessage = document.getElementById("gaming-message");
const formHeading = document.getElementById("gaming-form-heading");
const submitButton = document.getElementById("gaming-submit");
const cancelButton = document.getElementById("gaming-cancel");

let games = [];
let editingGameId = null;

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
    gamingMessage.textContent = text;
    gamingMessage.style.color = isError ? "#a65f56" : "inherit";
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

async function loadGames() {
    gamingList.innerHTML = "<p>Loading your games...</p>";

    try {
        const result = await apiRequest(API_URL);
        games = Array.isArray(result.data) ? result.data : [];
        renderGames();
    } catch (error) {
        gamingList.innerHTML = "<p>Could not load your games.</p>";
        showMessage(error.message, true);
    }
}

function renderGames() {
    if (games.length === 0) {
        gamingList.innerHTML = `
            <div class="gaming-empty" style="grid-column:1/-1;">
                <div style="font-size:2.5rem;">🎮</div>
                <h3>No games added yet</h3>
                <p>Add your first game and start building your gaming collection!</p>
            </div>
        `;
        return;
    }

    gamingList.innerHTML = games.map((game, index) => `
        <article class="game-card">
            <h3>🎮 ${escapeHTML(game.gameName || `Game ${index + 1}`)}</h3>
            ${game.rank ? `
                <div class="game-rank">🏅 ${escapeHTML(game.rank)}</div>
            ` : ""}
            <p class="game-details">${escapeHTML(game.details || "No details added yet.")}</p>

            <div class="game-actions">
                <button
                    type="button"
                    class="game-action game-edit"
                    data-edit-id="${escapeHTML(game._id)}"
                >✏️ Edit</button>

                <button
                    type="button"
                    class="game-action game-delete"
                    data-delete-id="${escapeHTML(game._id)}"
                >🗑️ Delete</button>
            </div>
        </article>
    `).join("");

    gamingList.querySelectorAll("[data-edit-id]").forEach(button => {
        button.addEventListener("click", () => editGame(button.dataset.editId));
    });

    gamingList.querySelectorAll("[data-delete-id]").forEach(button => {
        button.addEventListener("click", () => deleteGame(button.dataset.deleteId));
    });
}

function editGame(gameId) {
    const game = games.find(item => item._id === gameId);
    if (!game) return;

    editingGameId = gameId;

    gameNameInput.value = game.gameName || "";
    gameRankInput.value = game.rank || "";
    gameDetailsInput.value = game.details || "";

    formHeading.textContent = "Edit Game";
    submitButton.textContent = "💾 Update Game";
    cancelButton.hidden = false;

    showMessage("You are editing: " + game.gameName);

    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
    form.reset();
    editingGameId = null;

    formHeading.textContent = "Add a Game";
    submitButton.textContent = "＋ Add Game";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edit cancelled.");
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const gameData = {
        gameName: gameNameInput.value.trim(),
        rank: gameRankInput.value.trim(),
        details: gameDetailsInput.value.trim()
    };

    if (!gameData.gameName) {
        showMessage("Please enter a game name.", true);
        gameNameInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = editingGameId ? "Updating..." : "Adding...";

    try {
        if (editingGameId) {
            await apiRequest(`${API_URL}/${editingGameId}`, {
                method: "PUT",
                body: JSON.stringify(gameData)
            });

            showMessage("Game updated successfully! 🎮");
        } else {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(gameData)
            });

            showMessage("Game added successfully! 🎮");
        }

        resetForm();
        await loadGames();

    } catch (error) {
        showMessage(error.message, true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = editingGameId ? "💾 Update Game" : "＋ Add Game";
    }
});

async function deleteGame(gameId) {
    const game = games.find(item => item._id === gameId);
    if (!game) return;

    if (!confirm(`Are you sure you want to delete "${game.gameName}"?`)) {
        return;
    }

    try {
        await apiRequest(`${API_URL}/${gameId}`, {
            method: "DELETE"
        });

        if (editingGameId === gameId) {
            resetForm();
        }

        showMessage("Game deleted successfully.");
        await loadGames();

    } catch (error) {
        showMessage(error.message, true);
    }
}

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
            button.classList.toggle(
                "active",
                button.dataset.themeChoice === theme
            );
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

loadGames();
