import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { productService } from "../services/productService";
import Layout from "../components/Layout";
import ProductModal from "../components/ProductModal";
import ConfirmDialog from "../components/ConfirmDialog";
import toast from "react-hot-toast";
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus, HiOutlineMagnifyingGlass } from "react-icons/hi2";

const CATEGORIES = [
  "Electronics", "Clothing", "Food & Beverage", "Hardware",
  "Stationery", "Furniture", "Cosmetics", "Automotive", "Other",
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters & pagination state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStock, setLowStock] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({
        search,
        category,
        lowStock: lowStock ? "true" : undefined,
        sortBy,
        order,
        page,
        limit: 10,
      });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setTotalProducts(res.data.totalProducts);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, category, lowStock, sortBy, order, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, lowStock]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productService.remove(deleteTarget._id);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleModalClose = (shouldRefetch) => {
    setShowModal(false);
    setEditProduct(null);
    if (shouldRefetch) fetchProducts();
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{totalProducts} items in inventory</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, SKU, category, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field w-auto"
        >
          <option value="createdAt">Date Added</option>
          <option value="productName">Name</option>
          <option value="quantity">Quantity</option>
          <option value="unitPrice">Price</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="input-field w-auto"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Low Stock Only
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📦</div>
                    <p>No products found.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-2 text-blue-600 hover:underline text-sm"
                    >
                      Add your first product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.productName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600">{p.supplier}</td>
                    <td className="px-4 py-3 text-gray-900">{p.quantity}</td>
                    <td className="px-4 py-3 text-gray-900">${p.unitPrice}</td>
                    <td className="px-4 py-3">
                      {p.isLowStock ? (
                        <span className="badge-low-stock">⚠ Low Stock</span>
                      ) : (
                        <span className="badge-ok">✓ In Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditProduct(p); setShowModal(true); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={handleModalClose}
          categories={CATEGORIES}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.productName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  );
};

export default Products;
