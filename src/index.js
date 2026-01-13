const Order = require("./models/Order");
const express = require("express");
const path = require("path");



// 👇 FORCE dotenv to read root .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");


const app = express();
app.use(express.json());

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
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

