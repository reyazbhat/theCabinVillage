// Home page script. Draws one card per cabin.
// Each cabin keeps its own info in cabins/<id>/cabin.json.

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

async function renderHome(grid) {
  const ids = await loadJSON(MEMBERS_URL);
  grid.replaceChildren();

  for (const id of ids) {
    const card = el("a", "cabin-card");
    card.href = `cabins/${encodeURIComponent(id)}/`;

    const icon = el("div", "icon", "🛖");
    const title = el("h2", "", id);
    const owner = el("p", "owner", "");
    const latest = el("p", "latest", "…");
    card.append(icon, title, owner, latest);
    grid.append(card);

    // Fill the card from that cabin's own cabin.json.
    // If one cabin's file is broken, only that card is affected.
    loadJSON(`cabins/${id}/cabin.json`)
      .then((c) => {
        icon.textContent = c.icon || "🛖";
        title.textContent = c.cabinTitle || id;
        owner.textContent = c.name || "";
        const first = c.cycles && c.cycles[0];
        latest.textContent = first ? `Latest: Cycle ${first.cycle} · ${first.status}` : "No cycles yet";
      })
      .catch(() => { latest.textContent = "No data yet"; });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cabin-grid");
  if (!grid) return;
  renderHome(grid).catch((err) => {
    grid.replaceChildren(el("p", "error", err.message));
    console.error(err);
  });
});
