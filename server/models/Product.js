const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    supplier: {
      type: String,
      required: [true, "Supplier is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: [true, "Minimum stock level is required"],
      min: [0, "Minimum stock cannot be negative"],
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field: is this product low on stock?
productSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.minimumStock;
});

// Make sure virtuals are included when converting to JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
