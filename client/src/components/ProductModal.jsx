import { useState, useEffect } from "react";
import { productService } from "../services/productService";
import toast from "react-hot-toast";
import { HiOutlineXMark } from "react-icons/hi2";

const INITIAL_FORM = {
  productName: "",
  sku: "",
  category: "",
  supplier: "",
  quantity: "",
  minimumStock: "",
  unitPrice: "",
  description: "",
};

const ProductModal = ({ product, onClose, categories }) => {
  const isEditing = Boolean(product);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        productName: product.productName,
        sku: product.sku,
        category: product.category,
        supplier: product.supplier,
        quantity: product.quantity,
        minimumStock: product.minimumStock,
        unitPrice: product.unitPrice,
        description: product.description || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await productService.update(product._id, form);
        toast.success("Product updated");
      } else {
        await productService.create(form);
        toast.success("Product added");
      }
      onClose(true); // true = refetch list
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={() => onClose(false)}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. ELEC-001"
                className="input-field uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                name="minimumStock"
                value={form.minimumStock}
                onChange={handleChange}
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="input-field resize-none"
                placeholder="Optional product description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving..." : isEditing ? "Update" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
