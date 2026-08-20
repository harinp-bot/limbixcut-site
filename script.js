// LIMBIX CUT — content is loaded from content/projects.json and content/settings.json
// so the site can be updated from /admin (Decap CMS) without touching this file.

const CATEGORY_STYLE = {
  "Films":         { color: "#125059", c1: "#0e3a40", c2: "#125059" },
  "Series":        { color: "#198CB3", c1: "#0f5c78", c2: "#198CB3" },
  "Commercials":   { color: "#33B3B3", c1: "#1f8080", c2: "#33B3B3" },
  "Music Videos":  { color: "#FF194D", c1: "#b3123a", c2: "#FF194D" }
};
const DEFAULT_STYLE = { color: "#125059", c1: "#0e3a40", c2: "#125059" };
const CATEGORY_ORDER = ["Films", "Series", "Commercials", "Music Videos"];

function styleFor(category) {
  return CATEGORY_STYLE[category] || DEFAULT_STYLE;
}

function el(tag, attrs = {}, html = "") {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (html) node.innerHTML = html;
  return node;
}

function renderProjects(items) {
  const grid = document.getElementById("work-grid");
  const filtersWrap = document.getElementById("filters");

  const categoriesPresent = CATEGORY_ORDER.filter(c => items.some(p => p.category === c))
    .concat([...new Set(items.map(p => p.category))].filter(c => !CATEGORY_ORDER.includes(c)));

  // Build filter buttons
  filtersWrap.innerHTML = "";
  const allBtn = el("button", { "data-active": "true", "data-filter": "All", style: "--cat-color:#111110" }, "All");
  filtersWrap.appendChild(allBtn);
  categoriesPresent.forEach(cat => {
    const s = styleFor(cat);
    filtersWrap.appendChild(el("button", { "data-filter": cat, style: `--cat-color:${s.color}` }, cat));
  });

  function draw(filter) {
    grid.innerHTML = "";
    const visible = filter === "All" ? items : items.filter(p => p.category === filter);
    if (!visible.length) {
      grid.classList.add("is-empty");
      grid.innerHTML = "No projects in this category yet — add one at <a href='../admin/' style='color:var(--cyan)'>/admin</a>.";
      return;
    }
    grid.classList.remove("is-empty");
    visible.forEach(p => {
      const s = styleFor(p.category);
      const card = el("a", {
        class: "card",
        style: `--cat-color:${s.color}`,
        href: p.videoUrl || "#",
        target: p.videoUrl ? "_blank" : "_self",
        rel: "noopener"
      });
      const thumbStyle = p.thumbnail
        ? `background-image:url('${p.thumbnail}')`
        : `--c1:${s.c1}; --c2:${s.c2};`;
      card.innerHTML = `
        <div class="thumb" style="${thumbStyle}">
          <div class="play"></div>
          <span class="tag-pill">${p.category || ""}</span>
        </div>
        <div class="card-body">
          <span class="cat">${p.category || ""}</span>
          <h3>${p.title || "Untitled project"}</h3>
          <p class="meta">${[p.client, p.year].filter(Boolean).join(" · ")}</p>
        </div>`;
      grid.appendChild(card);
    });
  }

  draw("All");
  filtersWrap.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filtersWrap.querySelectorAll("button").forEach(b => b.removeAttribute("data-active"));
    btn.setAttribute("data-active", "true");
    draw(btn.dataset.filter);
  });
}

function renderSettings(s) {
  // Logo — this only replaces the nav bar logo, which is meant to be your real,
  // fully-designed lockup (icon + wordmark already combined in the image itself).
  // Nothing extra is added next to it in HTML/CSS, so whatever you upload here is
  // shown exactly as-is. The small X mark used decoratively elsewhere (hero watermark,
  // about panel, footer, favicon) stays fixed and is not affected by this field —
  // ask Claude if you want those swapped out too.
  if (s.logo) {
    document.querySelectorAll(".nav-logo").forEach(img => img.src = s.logo);
  }

  // Hero background photo — leave settings.heroBackground blank to keep the default
  // dark gradient + large watermark mark look.
  const heroPhoto = document.getElementById("hero-photo");
  if (s.heroBackground) {
    heroPhoto.style.backgroundImage = `url('${s.heroBackground}')`;
    heroPhoto.classList.add("is-visible");
  }

  const heroStats = document.getElementById("hero-stats");
  heroStats.innerHTML = (s.stats || []).map(st =>
    `<div><span class="num">${st.num}</span><span class="lbl">${st.label}</span></div>`
  ).join("");

  const clientNames = document.getElementById("client-names");
  clientNames.innerHTML = (s.clients || []).map(c => `<span>${c}</span>`).join("");

  const footContact = document.getElementById("foot-contact");
  footContact.innerHTML = `
    <h5>Contact</h5>
    ${s.email ? `<a href="mailto:${s.email}">${s.email}</a>` : ""}
    ${s.phone ? `<p>${s.phone}</p>` : ""}
    ${s.address ? `<p>${s.address}</p>` : ""}`;

  const footFollow = document.getElementById("foot-follow");
  const socialLinks = [
    s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener">Instagram</a>` : "",
    s.facebook ? `<a href="${s.facebook}" target="_blank" rel="noopener">Facebook</a>` : ""
  ].filter(Boolean).join("");
  footFollow.innerHTML = `<h5>Follow</h5>${socialLinks || "<p>—</p>"}`;

  const ctaEmail = document.getElementById("cta-email");
  if (s.email) ctaEmail.href = `mailto:${s.email}`;

  const footCopyright = document.getElementById("foot-copyright");
  if (s.copyright) footCopyright.textContent = s.copyright;
}

Promise.all([
  fetch("content/projects.json").then(r => r.json()).catch(() => ({ items: [] })),
  fetch("content/settings.json").then(r => r.json()).catch(() => ({}))
]).then(([projects, settings]) => {
  renderProjects(projects.items || []);
  renderSettings(settings);
});
