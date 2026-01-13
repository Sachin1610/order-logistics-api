const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    customerName: {
      type: String,
      required: true
    },
    items: [
      {
        name: String,
        quantity: Number
      }
    ],
    status: {
      type: String,
      enum: ["PENDING", "SHIPPED", "DELIVERED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
