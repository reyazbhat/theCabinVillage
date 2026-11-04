// Shared script for index.html (home) and cabin.html (single cabin).

const MEMBERS_URL = "data/members.json";

async function loadJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent keeps user data safe
  return node;
}

function statusClass(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

/* ---------------- Home page ---------------- */
async function renderHome(grid) {
  const members = await loadJSON(MEMBERS_URL);
  grid.replaceChildren();

  for (const m of members) {
    const card = el("a", "cabin-card");
    card.href = `cabin.html?member=${encodeURIComponent(m.id)}`;

    card.append(
      el("div", "icon", m.icon || "🛖"),
      el("h2", "", m.cabinTitle || `${m.name}'s Cabin`),
      el("p", "owner", m.name)
    );

    // Show the latest cycle (if the member's file loads).
    const latest = el("p", "latest", "…");
    card.append(latest);
    loadJSON(`data/${m.id}.json`)
      .then((d) => {
        const c = d.cycles && d.cycles[0];
        latest.textContent = c ? `Latest: Cycle ${c.cycle} · ${c.status}` : "No cycles yet";
      })
      .catch(() => { latest.textContent = "No data yet"; });

    grid.append(card);
  }
}

/* ---------------- Cabin page ---------------- */
async function renderCabin(view) {
  const id = new URLSearchParams(location.search).get("member");
  const members = await loadJSON(MEMBERS_URL);

  // Only allow ids that exist in members.json.
  const member = members.find((m) => m.id === id);
  if (!member) throw new Error("That cabin doesn't exist.");

  const data = await loadJSON(`data/${member.id}.json`);
  const title = data.cabinTitle || member.cabinTitle || `${member.name}'s Cabin`;

  document.title = `${title} · The Cabin Village`;
  document.getElementById("cabin-title").textContent = `${member.icon || "🛖"} ${title}`;
  document.getElementById("cabin-owner").textContent = `Resident: ${data.name || member.name}`;

  view.replaceChildren();
  const cycles = data.cycles || [];
  if (!cycles.length) {
    view.append(el("p", "empty", "No cycle updates yet."));
    return;
  }

  const list = el("ul", "cycle-list");
  for (const c of cycles) {
    const li = el("li", "cycle");
    const h3 = el("h3", "", `Cycle ${c.cycle}`);
    h3.append(el("span", `badge ${statusClass(c.status)}`, c.status || "—"));
    li.append(h3, el("div", "date", c.date || ""), el("p", "", c.notes || ""));
    list.append(li);
  }
  view.append(list);
}

/* ---------------- Boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cabin-grid");
  const view = document.getElementById("cabin-view");
  const target = grid || view;
  const run = grid ? renderHome(grid) : view ? renderCabin(view) : null;
  if (run) {
    run.catch((err) => {
      target.replaceChildren(el("p", "error", err.message));
      console.error(err);
    });
  }
});
