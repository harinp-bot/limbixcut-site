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

function initMobileNav() {
  const header = document.querySelector("header");
  const menuBtn = document.getElementById("menu-btn");
  const navMenu = document.getElementById("nav-menu");
  if (!header || !menuBtn || !navMenu) return;

  function closeMenu() {
    header.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";
  }
  function openMenu() {
    header.classList.add("nav-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.textContent = "✕";
  }

  menuBtn.addEventListener("click", () => {
    if (header.classList.contains("nav-open")) closeMenu();
    else openMenu();
  });

  // Tapping a nav link (Work / About / Team / Contact / Start a project)
  // closes the dropdown so it doesn't stay open over the section you jumped to.
  navMenu.addEventListener("click", e => {
    if (e.target.closest("a")) closeMenu();
  });

  // If the screen is resized/rotated past the mobile breakpoint while the
  // menu happens to be open, don't leave it stuck open in desktop layout.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}
initMobileNav();

const ALL_VIEW_LIMIT = 9; // how many cards show under "All" before "See more"

// Pinned/Featured projects always float to the top; everything else sorts by
// year, newest first. Projects with a missing or non-numeric year sink to the
// bottom instead of breaking the sort.
function sortProjects(items) {
  return [...items].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    const aYear = parseInt(a.year, 10);
    const bYear = parseInt(b.year, 10);
    const aValid = !isNaN(aYear);
    const bValid = !isNaN(bYear);
    if (aValid && bValid) return bYear - aYear;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  });
}

function renderProjects(rawItems) {
  const items = sortProjects(rawItems);
  const grid = document.getElementById("work-grid");
  const filtersWrap = document.getElementById("filters");
  let allExpanded = false; // resets to collapsed whenever "All" is re-entered fresh

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
    const oldMoreWrap = document.getElementById("work-more");
    if (oldMoreWrap) oldMoreWrap.remove();

    const visible = filter === "All" ? items : items.filter(p => p.category === filter);
    if (!visible.length) {
      grid.classList.add("is-empty");
      grid.innerHTML = "No projects in this category yet — add one at <a href='../admin/' style='color:var(--cyan)'>/admin</a>.";
      return;
    }
    grid.classList.remove("is-empty");

    // Only the "All" tab truncates — picking a specific category always shows
    // every project in it, since that's already a filtered, shorter list.
    const isTruncated = filter === "All" && !allExpanded && visible.length > ALL_VIEW_LIMIT;
    const toRender = isTruncated ? visible.slice(0, ALL_VIEW_LIMIT) : visible;

    toRender.forEach(p => {
      const s = styleFor(p.category);
      const card = el("a", {
        class: "card",
        style: `--cat-color:${s.color}`,
        href: p.videoUrl || "#",
        target: p.videoUrl ? "_blank" : "_self",
        rel: "noopener"
      });
      const thumbStyle = p.thumbnail
        ? `background-image:url('${p.thumbnail}'); background-position:${p.thumbnailPosition || "center"};`
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

    if (isTruncated) {
      const moreWrap = el("div", { id: "work-more", class: "work-more" });
      const moreBtn = el("button", { class: "btn outline" }, `See all ${visible.length} projects →`);
      moreBtn.addEventListener("click", () => {
        allExpanded = true;
        draw("All");
      });
      moreWrap.appendChild(moreBtn);
      grid.insertAdjacentElement("afterend", moreWrap);
    }
  }

  draw("All");
  filtersWrap.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filtersWrap.querySelectorAll("button").forEach(b => b.removeAttribute("data-active"));
    btn.setAttribute("data-active", "true");
    if (btn.dataset.filter === "All") allExpanded = false; // fresh click on All always starts collapsed
    draw(btn.dataset.filter);
  });
}

function renderTeam(items) {
  const grid = document.getElementById("team-grid");
  if (!grid) return;
  grid.innerHTML = (items || []).map(m => {
    const photoStyle = m.photo
      ? ` style="background-image:url('${m.photo}'); background-size:cover; background-position:center;"`
      : "";
    const tag = m.imdbUrl ? "a" : "div";
    const linkAttrs = m.imdbUrl
      ? ` href="${m.imdbUrl}" target="_blank" rel="noopener noreferrer"`
      : "";
    return `
      <${tag} class="member"${linkAttrs}>
        <div class="photo"${photoStyle}></div>
        <h4>${m.name || "Name Surname"}</h4>
        <p>${m.title || ""}</p>
      </${tag}>`;
  }).join("");
}

// Sets textContent on every element matching `selector` (there can be more
// than one — e.g. the same nav label appears in the header AND the footer).
function setAllText(selector, value) {
  if (value === undefined || value === null) return;
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

function renderSettings(s) {
  // Nav labels — shared between the header menu and the footer "Studio" column.
  setAllText(".lbl-work", s.navWork);
  setAllText(".lbl-about", s.navAbout);
  setAllText(".lbl-team", s.navTeam);
  setAllText(".lbl-contact", s.navContact);
  setAllText(".lbl-nav-cta", s.navCta);

  // Hero
  setText("hero-eyebrow", s.heroEyebrow);
  setText("hero-title-before", s.heroTitleBefore);
  setText("hero-title-accent", s.heroTitleAccent);
  setText("hero-title-after", s.heroTitleAfter);
  setText("hero-sub", s.heroSub);
  setText("hero-btn-work", s.heroBtnWork);
  setText("hero-btn-contact", s.heroBtnContact);

  // Awards & festival selections strip — hidden entirely until at least one
  // award is added via /admin, so an empty list doesn't leave a blank bar.
  setText("awards-label", s.awardsLabel);
  const awardsStrip = document.getElementById("awards-strip");
  const awardBadges = document.getElementById("award-badges");
  const awards = (s.awards || []).filter(a => a && a.text);
  if (awardsStrip && awardBadges) {
    if (awards.length) {
      awardsStrip.classList.remove("is-empty");
      awardBadges.innerHTML = awards.map(a => {
        const tag = a.link ? "a" : "span";
        const linkAttrs = a.link ? ` href="${a.link}" target="_blank" rel="noopener noreferrer"` : "";
        return `<${tag} class="award-badge"${linkAttrs}>${a.text}</${tag}>`;
      }).join("");
    } else {
      awardsStrip.classList.add("is-empty");
      awardBadges.innerHTML = "";
    }
  }

  // Client strip
  setText("clients-label", s.clientsLabel);

  // Section labels
  setText("work-secnum", s.workSecNum);
  setText("about-secnum", s.aboutSecNum);
  setText("team-secnum", s.teamSecNum);
  setText("team-heading", s.teamHeading);

  // CTA band
  setText("cta-heading-before", s.ctaHeadingBefore);
  setText("cta-heading-accent", s.ctaHeadingAccent);
  setText("cta-heading-after", s.ctaHeadingAfter);
  const ctaEmailBtn = document.getElementById("cta-email");
  if (ctaEmailBtn && s.ctaButtonText) ctaEmailBtn.textContent = s.ctaButtonText;

  // Footer headings
  setText("foot-studio-heading", s.footStudioHeading);
  // s.footTagline itself is applied further down, alongside the fixed "/admin" link.

  // Browser tab title / search-result description
  if (s.seoTitle) document.title = s.seoTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && s.seoDescription) metaDesc.setAttribute("content", s.seoDescription);

  const workIntro = document.getElementById("work-intro");
  if (workIntro) workIntro.textContent = s.workIntro || "";

  const aboutLead = document.getElementById("about-lead");
  if (aboutLead) aboutLead.textContent = s.aboutLead || "";

  const aboutText = document.getElementById("about-text");
  if (aboutText) aboutText.textContent = s.aboutText || "";

  const aboutStats = document.getElementById("about-stats");
  if (aboutStats) {
    aboutStats.innerHTML = (s.aboutStats || []).map(st =>
      `<div><span class="n">${st.num}</span><span class="l">${st.label}</span></div>`
    ).join("");
  }

  const teamIntro = document.getElementById("team-intro");
  if (teamIntro) teamIntro.textContent = s.teamIntro || "";

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

  // Client logos — each entry can be { name, logo } (preferred) or a plain
  // string left over from before logos were supported; either way, if no
  // logo image is set yet we fall back to showing the name as text so
  // nothing goes blank while logos are still being uploaded.
  const clientNames = document.getElementById("client-names");
  clientNames.innerHTML = (s.clients || []).map(c => {
    const client = typeof c === "string" ? { name: c, logo: "" } : (c || {});
    const name = client.name || "";
    return client.logo
      ? `<img src="${client.logo}" alt="${name}">`
      : `<span>${name}</span>`;
  }).join("");

  const footContact = document.getElementById("foot-contact");
  footContact.innerHTML = `
    <h5>${s.footContactHeading || "Contact"}</h5>
    ${s.email ? `<a href="mailto:${s.email}">${s.email}</a>` : ""}
    ${s.phone ? `<p>${s.phone}</p>` : ""}
    ${s.address ? `<p>${s.address}</p>` : ""}`;

  const footFollow = document.getElementById("foot-follow");
  const socialLinks = [
    s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener">Instagram</a>` : "",
    s.facebook ? `<a href="${s.facebook}" target="_blank" rel="noopener">Facebook</a>` : ""
  ].filter(Boolean).join("");
  footFollow.innerHTML = `<h5>${s.footFollowHeading || "Follow"}</h5>${socialLinks || "<p>—</p>"}`;

  const ctaEmail = document.getElementById("cta-email");
  if (s.email) ctaEmail.href = `mailto:${s.email}`;

  const footCopyright = document.getElementById("foot-copyright");
  if (s.copyright) footCopyright.textContent = s.copyright;

  // foot-tagline keeps its "/admin" link fixed — only the leading phrase is editable.
  const footTagline = document.getElementById("foot-tagline");
  if (footTagline && s.footTagline) {
    footTagline.innerHTML = `${s.footTagline} <a href="admin/">/admin</a>`;
  }
}

Promise.all([
  fetch("content/projects.json").then(r => r.json()).catch(() => ({ items: [] })),
  fetch("content/settings.json").then(r => r.json()).catch(() => ({})),
  fetch("content/team.json").then(r => r.json()).catch(() => ({ items: [] }))
]).then(([projects, settings, team]) => {
  renderProjects(projects.items || []);
  renderSettings(settings);
  renderTeam(team.items || []);
});
