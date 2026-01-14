const ordersDiv = document.getElementById("orders");
const msg = document.getElementById("msg");
const formMsg = document.getElementById("formMsg");

const form = document.getElementById("orderForm");

async function loadOrders() {
  ordersDiv.innerHTML = "";
  msg.textContent = "Loading...";
  try {
    const res = await fetch("/orders");
    const data = await res.json();

    msg.textContent = "";

    if (!data.length) {
      ordersDiv.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    data.forEach(order => {
      const div = document.createElement("div");
      div.className = "order";
      div.innerHTML = `
        <b>${order.orderId}</b> — ${order.customerName}<br/>
        Status: <b>${order.status}</b><br/>
        Item: ${order.items?.[0]?.name || "N/A"} (Qty: ${order.items?.[0]?.quantity || 0})<br/>
        <small>ID: ${order._id}</small>

        <div class="actions">
          <select id="status-${order._id}">
            <option value="PENDING" ${order.status === "PENDING" ? "selected" : ""}>PENDING</option>
            <option value="SHIPPED" ${order.status === "SHIPPED" ? "selected" : ""}>SHIPPED</option>
            <option value="DELIVERED" ${order.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option>
          </select>

          <button class="btn-update" onclick="updateStatus('${order._id}')">Update</button>
          <button class="btn-delete" onclick="deleteOrder('${order._id}')">Delete</button>
        </div>
      `;
      ordersDiv.appendChild(div);
    });
  } catch (err) {
    msg.textContent = "Failed to load orders.";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "Creating...";
  try {
    const body = {
      orderId: document.getElementById("orderId").value,
      customerName: document.getElementById("customerName").value,
      items: [
        {
          name: document.getElementById("itemName").value,
          quantity: Number(document.getElementById("quantity").value)
        }
      ],
      status: "PENDING"
    };

    const res = await fetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      formMsg.textContent = data.error || "Error creating order";
      return;
    }

    form.reset();
    formMsg.textContent = "✅ Order created!";
    loadOrders();
  } catch (err) {
    formMsg.textContent = "Error creating order";
  }
});

async function updateStatus(id) {
  const status = document.getElementById(`status-${id}`).value;
  try {
    const res = await fetch(`/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Update failed");
      return;
    }

    loadOrders();
  } catch (err) {
    alert("Update failed");
  }
}

async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  try {
    const res = await fetch(`/orders/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    loadOrders();
  } catch (err) {
    alert("Delete failed");
  }
}

loadOrders();
