/* =========================================================================
   CST SMS - shared browser logic
   Session handling, API helpers, the sidebar/topbar shell, downloads and
   small UI helpers. Every page loads this file first.
   ========================================================================= */

// ---------- Messages ----------
function showMessage(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add("show", isError ? "error" : "success");
  el.setAttribute("role", isError ? "alert" : "status");
}

function clearMessage(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.remove("show", "error", "success");
}

function notify(text, isError) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.className = "toast show " + (isError ? "error" : "success");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

// ---------- Session (token kept in sessionStorage) ----------
function getToken() { return sessionStorage.getItem("token"); }
function getUser() {
  try { return JSON.parse(sessionStorage.getItem("user")); } catch { return null; }
}
function saveSession(token, user) {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
}
function clearSession() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function badge(text, kind) {
  return `<span class="badge ${kind}">${escapeHtml(text)}</span>`;
}

function gradeChip(grade) {
  const letter = String(grade || "").charAt(0);
  const kind = letter === "A" || letter === "B" ? "good" : letter === "C" ? "warn" : letter === "D" || letter === "F" ? "bad" : "";
  return `<span class="grade ${kind}">${escapeHtml(grade)}</span>`;
}

// ---------- API helpers (attach the token automatically) ----------
async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    return { ok: false, status: 0, data: { message: "Cannot reach the server. Check your connection and try again." } };
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  // Token missing or expired on a protected call -> back to login with an explanation
  if (res.status === 401 && token && !url.endsWith("/api/login")) {
    clearSession();
    sessionStorage.setItem("flash", "Your session has ended. Please log in again.");
    window.location.href = "login.html";
  }
  return { ok: res.ok, status: res.status, data };
}

function postJSON(url, body) {
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function putJSON(url, body) {
  return apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getJSON(url) {
  return apiFetch(url);
}

// Download a PDF from a protected endpoint (the bearer token cannot be sent by a plain link).
async function downloadFile(url, filename) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let message = "The file could not be downloaded.";
    try { message = (await res.json()).message || message; } catch { /* not JSON */ }
    throw new Error(message);
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Disable a button while work is in progress.
function setBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    btn.dataset.label = btn.textContent;
    btn.textContent = label || "Please wait...";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
    btn.disabled = false;
  }
}

// Any element with data-download-url becomes a PDF download button.
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-download-url]");
  if (!btn) return;
  e.preventDefault();
  setBusy(btn, true, "Preparing PDF...");
  try {
    await downloadFile(btn.dataset.downloadUrl, btn.dataset.filename || "download.pdf");
  } catch (err) {
    notify(err.message, true);
  } finally {
    setBusy(btn, false);
  }
});

// ---------- Page guards ----------
// Call at the top of a protected page. Optionally restrict to a role.
function requireLogin(role) {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = "login.html";
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

async function logout() {
  await apiFetch("/api/logout", { method: "POST" });
  clearSession();
  window.location.href = "login.html";
}

// ---------- Icons ----------
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  payment: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  register: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
  results: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  students: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 11a4 4 0 1 0 0-8"/><path d="M22 21a7 7 0 0 0-5-6.7"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

// ---------- App shell (sidebar + topbar) ----------
const NAV = [
  { key: "dashboard", label: "Dashboard", href: "index.html", icon: "dashboard", roles: ["student", "admin"] },
  { key: "payment", label: "Pay Tuition", href: "payment.html", icon: "payment", roles: ["student"] },
  { key: "register", label: "Register Modules", href: "register.html", icon: "register", roles: ["student"] },
  { key: "results", label: "Results", href: "results.html", icon: "results", roles: ["student", "admin"] },
  { key: "students", label: "Students", href: "students.html", icon: "students", roles: ["admin"] },
];

function initials(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function setSidebarOpen(open) {
  document.getElementById("sidebar")?.classList.toggle("open", open);
  document.getElementById("overlay")?.classList.toggle("show", open);
  document.getElementById("menuBtn")?.setAttribute("aria-expanded", String(open));
}

function initShell(activeKey, title) {
  const user = getUser();
  const sidebar = document.getElementById("sidebar");
  if (!sidebar || !user) return;

  const items = NAV.filter((item) => item.roles.includes(user.role));
  sidebar.innerHTML = `
    <div class="brand">
      <img class="brand-logo" src="assets/cst-logo.jpg" alt="CST logo" />
      <div><strong>Student Portal</strong><small>College of Science and Technology</small></div>
    </div>
    <div class="nav-section">Menu</div>
    <nav class="nav" aria-label="Main navigation">
      ${items.map((item) => `
        <a class="nav-link${item.key === activeKey ? " active" : ""}" href="${item.href}"${item.key === activeKey ? ' aria-current="page"' : ""}>
          ${icon(item.icon)}<span>${item.label}</span>
        </a>`).join("")}
    </nav>
    <div class="sidebar-footer">
      <button class="nav-link" id="sideLogout" type="button">${icon("logout")}<span>Log out</span></button>
    </div>`;

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = title || "";
  document.title = `${title} · CST SMS`;

  const chip = document.getElementById("userChip");
  if (chip) {
    chip.innerHTML = `
      <span class="avatar">${escapeHtml(initials(user.fullName || user.studentId))}</span>
      <span class="user-meta">
        <strong>${escapeHtml(user.fullName || user.studentId)}</strong>
        <small>${escapeHtml(user.role)} · ${escapeHtml(user.studentId)}</small>
      </span>`;
  }

  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.innerHTML = icon("menu");
    menuBtn.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("open")));
  }
  document.getElementById("overlay")?.addEventListener("click", () => setSidebarOpen(false));
  document.getElementById("sideLogout")?.addEventListener("click", logout);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setSidebarOpen(false); });
  sidebar.querySelectorAll(".nav-link[href]").forEach((a) => a.addEventListener("click", () => setSidebarOpen(false)));
}
