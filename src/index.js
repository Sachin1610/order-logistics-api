// src/index.js

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const Order = require("./models/Order");
const connectDB = require("./config/db");

// ✅ AUTH (NEW)
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/auth");
const { allowRoles } = require("./middleware/roles");


// ✅ FORCE dotenv to read root .env (project root)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
app.use(express.json());

// ✅ Serve frontend from /public
app.use(express.static(path.join(__dirname, "..", "public")));

// ✅ Connect DB
connectDB();

// ✅ Mount Auth Routes (NEW)
app.use("/api/auth", authRoutes);

// ✅ Root loads UI (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ✅ CREATE: POST /orders (PROTECTED)
app.post("/orders", protect, async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ READ ALL: GET /orders (PROTECTED)
app.get("/orders", protect, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ READ ONE: GET /orders/:id (PROTECTED)
app.get("/orders/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE: PUT /orders/:id (PROTECTED)
app.put("/orders/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE: DELETE /orders/:id (PROTECTED)
app.delete("/orders/:id", protect, allowRoles("admin", "manager"), async (req, res) => {

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully ✅", deletedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
