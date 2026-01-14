const Order = require("./models/Order");
const express = require("express");
const path = require("path");

// 👇 FORCE dotenv to read root .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

// Connect DB
connectDB();

app.get("/", (req, res) => {
  res.json({ message: "Order & Logistics API is running ✅" });
});

app.post("/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: Get a single order by MongoDB _id
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: "Invalid order ID" });
  }
});


// ✅ PUT: Update an order (example: update status)
const mongoose = require("mongoose");

// ✅ PUT: Update order by MongoDB _id
app.put("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format (prevents silent not-found issues)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ DELETE: Delete an order by MongoDB _id
app.delete("/orders/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully ✅", deletedOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});