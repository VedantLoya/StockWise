const Product = require("../models/Product");

// @route   GET /api/products
// @desc    Get all products for the logged-in user with search, filter, sort, pagination
// @access  Private
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      lowStock,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter query
    const query = { createdBy: req.user._id };

    // Search across multiple fields
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "all") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    // Filter low stock: quantity <= minimumStock
    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantity", "$minimumStock"] };
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/products
// @desc    Create a new product
// @access  Private
const createProduct = async (req, res) => {
  const { productName, sku, category, supplier, quantity, minimumStock, unitPrice, description } =
    req.body;

  if (!productName || !sku || !category || !supplier || unitPrice === undefined) {
    return res.status(400).json({ message: "Please fill in all required fields" });
  }

  try {
    // Check for duplicate SKU
    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "A product with this SKU already exists" });
    }

    const product = await Product.create({
      productName,
      sku,
      category,
      supplier,
      quantity: quantity || 0,
      minimumStock: minimumStock || 0,
      unitPrice,
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "A product with this SKU already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If SKU is being changed, check it's not already taken
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existing = await Product.findOne({ sku: req.body.sku.toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: "A product with this SKU already exists" });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "A product with this SKU already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.json({ message: "Product removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/products/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const allProducts = await Product.find({ createdBy: userId });

    const totalProducts = allProducts.length;

    // Get unique categories
    const categories = [...new Set(allProducts.map((p) => p.category))];
    const totalCategories = categories.length;

    // Low stock products
    const lowStockProducts = allProducts.filter(
      (p) => p.quantity <= p.minimumStock
    );

    // Total inventory value: sum of (quantity * unitPrice)
    const totalValue = allProducts.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );

    // Recently added (last 5)
    const recentProducts = await Product.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalProducts,
      totalCategories,
      lowStockCount: lowStockProducts.length,
      totalValue: totalValue.toFixed(2),
      lowStockProducts,
      recentProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getDashboardStats,
};
