import { useEffect, useState } from "react";
import { productService } from "../services/productService";
import Layout from "../components/Layout";

const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getAll({ lowStock: "true", limit: 100 })
      .then((res) => setProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">⚠ Low Stock Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Products where quantity is at or below the minimum stock level
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Current Qty</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Min. Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Shortage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">✅</div>
                    <p>All products are well stocked!</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="bg-amber-50/40 hover:bg-amber-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600">{p.supplier}</td>
                    <td className="px-4 py-3 font-medium text-red-600">{p.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{p.minimumStock}</td>
                    <td className="px-4 py-3">
                      <span className="badge-low-stock">
                        ⚠ {Math.max(0, p.minimumStock - p.quantity + 1)} units needed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default LowStock;
