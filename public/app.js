const ordersList = document.getElementById("ordersList");
const emptyState = document.getElementById("emptyState");
const loadingEl = document.getElementById("loading");
const toastEl = document.getElementById("toast");

const createForm = document.getElementById("createForm");
const createBtn = document.getElementById("createBtn");
const refreshBtn = document.getElementById("refreshBtn");

// AUTH UI
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authInfo = document.getElementById("authInfo");

// Cards/Sections
const authCard = document.getElementById("authCard");

// -----------------------------
// Helpers
// -----------------------------
function showToast(msg, type = "ok") {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden", "ok", "err");
  toastEl.classList.add(type === "err" ? "err" : "ok");
  setTimeout(() => toastEl.classList.add("hidden"), 2200);
}

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
  refreshBtn.disabled = isLoading;
  createBtn.disabled = isLoading;
}

function badgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "shipped") return "badge shipped";
  if (s === "delivered") return "badge delivered";
  return "badge pending";
}

function renderOrders(orders) {
  ordersList.innerHTML = "";

  if (!orders || orders.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  // check role from authInfo text (or better: store current user)
  const token = getToken();
  let canDelete = false;

  // Simple way: if logged in, call /me once and cache role
  // We will use a global variable for current user role:
  if (window.__currentUserRole === "admin" || window.__currentUserRole === "manager") {
    canDelete = true;
  }

  for (const o of orders) {
    const row = document.createElement("div");
    row.className = "orderRow";

    const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : "-";

    row.innerHTML = `
      <div class="left">
        <div class="meta">
          <strong>${o.orderId}</strong>
          <span class="${badgeClass(o.status)}">${o.status}</span>
          <span class="small">Customer: ${o.customerName}</span>
        </div>
        <div class="small">Created: ${created}</div>
      </div>

      <div class="actions">
        <select data-id="${o._id}">
          <option value="PENDING" ${o.status === "PENDING" ? "selected" : ""}>PENDING</option>
          <option value="SHIPPED" ${o.status === "SHIPPED" ? "selected" : ""}>SHIPPED</option>
          <option value="DELIVERED" ${o.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option>
        </select>

        <button class="secondary" data-update="${o._id}">Update</button>
        ${
          canDelete
            ? `<button class="btnDanger" data-del="${o._id}">Delete</button>`
            : ``
        }
      </div>
    `;

    ordersList.appendChild(row);
  }
}


// -----------------------------
// JWT AUTH (NEW UI BASED)
// -----------------------------
const TOKEN_KEY = "jwt_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function setAuthUI(user) {
    window.__currentUserRole = user ? user.role : null; 
  const loggedIn = !!user;

  // show info
  authInfo.textContent = loggedIn
    ? `Logged in as: ${user.email} (${user.role})`
    : "Not logged in";

  // buttons / inputs
  logoutBtn.style.display = loggedIn ? "inline-block" : "none";
  loginBtn.style.display = loggedIn ? "none" : "inline-block";
  registerBtn.style.display = loggedIn ? "none" : "inline-block";

  authName.disabled = loggedIn;
  authEmail.disabled = loggedIn;
  authPassword.disabled = loggedIn;

  // disable order actions if not logged in
  createBtn.disabled = !loggedIn;
  refreshBtn.disabled = !loggedIn;
}

async function fetchMe() {
  const token = getToken();
  if (!token) {
    setAuthUI(null);
    return null;
  }

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      clearToken();
      setAuthUI(null);
      return null;
    }

    setAuthUI(data.user);
    return data.user;
  } catch (e) {
    clearToken();
    setAuthUI(null);
    return null;
  }
}

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
    setLoading(true);

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

    // lock UI and load orders
    await fetchMe();
    await loadOrders();
  } catch (err) {
    showToast(err.message, "err");
  } finally {
    setLoading(false);
  }
}

async function authFetch(url, options = {}) {
  const token = getToken();

  if (!token) {
    // not logged in
    return fetch(url, options);
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, { ...options, headers });

  // if token invalid, auto logout UI
  if (res.status === 401) {
    clearToken();
    setAuthUI(null);
    showToast("Session expired. Please login again.", "err");
  }

  return res;
}

// -----------------------------
// Orders API calls (protected)
// -----------------------------
async function loadOrders() {
  try {
    setLoading(true);

    const token = getToken();
    if (!token) {
      ordersList.innerHTML = "";
      emptyState.classList.remove("hidden");
      emptyState.textContent = "Please login to view orders.";
      return;
    }

    const res = await authFetch("/orders");
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || "Failed to load orders");

    emptyState.textContent = "No orders yet.";
    renderOrders(data);
  } catch (err) {
    showToast(err.message || "Failed to load orders", "err");
  } finally {
    setLoading(false);
  }
}

// Create
createForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getToken();
  if (!token) {
    showToast("Please login first", "err");
    return;
  }

  const orderId = document.getElementById("orderId").value.trim();
  const customerName = document.getElementById("customerName").value.trim();
  const itemName = document.getElementById("itemName").value.trim();
  const quantity = Number(document.getElementById("quantity").value);

  try {
    setLoading(true);

    const res = await authFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        customerName,
        items: [{ name: itemName, quantity }],
        status: "PENDING",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Create failed");

    showToast("Order created ✅");
    createForm.reset();
    await loadOrders();
  } catch (err) {
    showToast(err.message, "err");
  } finally {
    setLoading(false);
  }
});

// Update/Delete
ordersList.addEventListener("click", async (e) => {
  const updateId = e.target.getAttribute("data-update");
  const deleteId = e.target.getAttribute("data-del");

  // UPDATE
  if (updateId) {
    const select = ordersList.querySelector(`select[data-id="${updateId}"]`);
    const status = select.value;

    try {
      setLoading(true);

      const res = await authFetch(`/orders/${updateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Update failed");

      showToast("Order updated ✅");
      await loadOrders();
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  // DELETE
  if (deleteId) {
    const ok = confirm("Delete this order?");
    if (!ok) return;

    try {
      setLoading(true);

      const res = await authFetch(`/orders/${deleteId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || "Delete failed");

      showToast("Order deleted ✅");
      await loadOrders();
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setLoading(false);
    }
  }
});

refreshBtn.addEventListener("click", loadOrders);

// AUTH button events
loginBtn.addEventListener("click", () => loginOrRegister("login"));
registerBtn.addEventListener("click", () => loginOrRegister("register"));
logoutBtn.addEventListener("click", async () => {
  clearToken();
  setAuthUI(null);
  showToast("Logged out ✅");
  ordersList.innerHTML = "";
  emptyState.classList.remove("hidden");
  emptyState.textContent = "Please login to view orders.";
});

// initial load
(async function init() {
  const user = await fetchMe();
  if (user) {
    await loadOrders();
  } else {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Please login to view orders.";
  }
})();
