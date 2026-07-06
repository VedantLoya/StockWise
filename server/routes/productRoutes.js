const express = require("express");
const router = express.Router();
const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getDashboardStats,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Dashboard stats - must be before /:id so it doesn't get caught as an id
router.get("/dashboard/stats", getDashboardStats);

router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProductById).put(updateProduct).delete(deleteProduct);

module.exports = router;
