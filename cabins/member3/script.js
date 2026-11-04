// YOUR CABIN'S SCRIPT. Edit freely: add buttons, animations, music, mini-games...
// This starter reads cabin.json (in this same folder) and shows your info + cycles.

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent keeps text safe
  return node;
}

async function loadCabin() {
  const list = document.getElementById("cycles");

  try {
    const res = await fetch("cabin.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load cabin.json");
    const cabin = await res.json();

    document.title = `${cabin.cabinTitle} · The Cabin Village`;
    document.getElementById("icon").textContent = cabin.icon || "🛖";
    document.getElementById("title").textContent = cabin.cabinTitle || "My Cabin";
    document.getElementById("owner").textContent = `Resident: ${cabin.name || ""}`;

    const cycles = cabin.cycles || [];
    if (!cycles.length) {
      list.append(make("li", "empty", "No cycle updates yet."));
      return;
    }

    for (const c of cycles) {
      const li = make("li", "cycle");
      const h3 = make("h3", "", `Cycle ${c.cycle}`);
      h3.append(make("span", "badge", c.status || "—"));
      li.append(h3, make("div", "date", c.date || ""), make("p", "", c.notes || ""));
      list.append(li);
    }
  } catch (err) {
    list.append(make("li", "empty", err.message));
    console.error(err);
  }
}

loadCabin();
