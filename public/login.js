const toastEl = document.getElementById("toast");
const authInfo = document.getElementById("authInfo");

const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const TOKEN_KEY = "jwt_token";

function showToast(msg, type = "ok") {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden", "ok", "err");
  toastEl.classList.add(type === "err" ? "err" : "ok");
  setTimeout(() => toastEl.classList.add("hidden"), 2200);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// If already logged in, go to dashboard
(async function redirectIfLoggedIn() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      window.location.href = "/"; // dashboard page (index.html)
    }
  } catch (e) {}
})();

async function loginOrRegister(mode) {
  const email = (authEmail.value || "").trim();
  const password = (authPassword.value || "").trim();
  const name = (authName.value || "").trim();

  if (!email || !password) {
    showToast("Email & password required", "err");
    return;
  }

  if (mode === "register" && !name) {
    showToast("Name required for register", "err");
    return;
  }

  const payload =
    mode === "register"
      ? { name, email, password }
      : { email, password };

  try {
    authInfo.textContent = "Please wait...";
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || `${mode} failed`);

    if (!data.token) throw new Error("No token received from server");

    setToken(data.token);
    showToast(`${mode.toUpperCase()} successful ✅`);

    // Redirect to dashboard
    window.location.href = "/";
  } catch (err) {
    showToast(err.message, "err");
    authInfo.textContent = "";
  }
}

loginBtn.addEventListener("click", () => loginOrRegister("login"));
registerBtn.addEventListener("click", () => loginOrRegister("register"));
