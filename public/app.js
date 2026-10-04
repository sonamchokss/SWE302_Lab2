// ---------- Message helper (unchanged) ----------
function showMessage(el, text, isError) {
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add("show", isError ? "error" : "success");
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

// ---------- API helpers (attach the token automatically) ----------
async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(url, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  // Token missing/expired on a protected call -> back to login
  if (res.status === 401 && token && !url.endsWith("/api/login")) {
    clearSession();
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

function getJSON(url) {
  return apiFetch(url);
}

// ---------- Page guards & navigation ----------
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

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const user = getUser();
  const links = [`<a href="index.html">Home</a>`];
  if (!user) {
    links.push(`<a href="login.html">Login</a>`);
  } else {
    links.push(`<a href="register.html">Registration</a>`, `<a href="results.html">Results</a>`);
    if (user.role === "admin") links.push(`<a href="students.html">Students</a>`);
  }
  let right = "";
  if (user) {
    right = `<span class="spacer"></span>
      <span class="whoami">${escapeHtml(user.fullName || user.studentId)} (${escapeHtml(user.role)})</span>
      <a href="#" id="logoutLink">Logout</a>`;
  }
  nav.innerHTML = links.join("") + right;
  const out = document.getElementById("logoutLink");
  if (out) out.addEventListener("click", (e) => { e.preventDefault(); logout(); });
}

document.addEventListener("DOMContentLoaded", renderNav);

// ---------- Shared footer ----------
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".site-footer")) return;
  const f = document.createElement("footer");
  f.className = "site-footer";
  f.innerHTML = `<span><strong>CST &middot; RUB</strong> &nbsp; College of Science and Technology</span>
    <span>SWE302 Student Management System &copy; ${new Date().getFullYear()}</span>`;
  document.body.appendChild(f);
});
