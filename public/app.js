const ordersList = document.getElementById("ordersList");
const emptyState = document.getElementById("emptyState");
const loadingEl = document.getElementById("loading");
const toastEl = document.getElementById("toast");

const createForm = document.getElementById("createForm");
const createBtn = document.getElementById("createBtn");
const refreshBtn = document.getElementById("refreshBtn");

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
        <button class="btnDanger" data-del="${o._id}">Delete</button>
      </div>
    `;

    ordersList.appendChild(row);
  }
}

async function loadOrders() {
  try {
    setLoading(true);
    const res = await fetch("/orders");
    const data = await res.json();
    renderOrders(data);
  } catch (err) {
    showToast("Failed to load orders", "err");
  } finally {
    setLoading(false);
  }
}

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = document.getElementById("orderId").value.trim();
  const customerName = document.getElementById("customerName").value.trim();
  const itemName = document.getElementById("itemName").value.trim();
  const quantity = Number(document.getElementById("quantity").value);

  try {
    setLoading(true);
    const res = await fetch("/orders", {
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
    if (!res.ok) throw new Error(data.error || "Create failed");

    showToast("Order created ✅");
    createForm.reset();
    await loadOrders();
  } catch (err) {
    showToast(err.message, "err");
  } finally {
    setLoading(false);
  }
});

ordersList.addEventListener("click", async (e) => {
  const updateId = e.target.getAttribute("data-update");
  const deleteId = e.target.getAttribute("data-del");

  // UPDATE
  if (updateId) {
    const select = ordersList.querySelector(`select[data-id="${updateId}"]`);
    const status = select.value;

    try {
      setLoading(true);
      const res = await fetch(`/orders/${updateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

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
      const res = await fetch(`/orders/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

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

// initial load
loadOrders();
