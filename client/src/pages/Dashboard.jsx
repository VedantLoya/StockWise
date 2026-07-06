import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../services/productService";
import Layout from "../components/Layout";
import {
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your inventory
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={HiOutlineCube}
          color="bg-blue-600"
        />
        <StatCard
          label="Categories"
          value={stats?.totalCategories ?? 0}
          icon={HiOutlineTag}
          color="bg-indigo-500"
        />
        <StatCard
          label="Low Stock Items"
          value={stats?.lowStockCount ?? 0}
          icon={HiOutlineExclamationTriangle}
          color="bg-amber-500"
        />
        <StatCard
          label="Total Value"
          value={`$${Number(stats?.totalValue ?? 0).toLocaleString()}`}
          icon={HiOutlineCurrencyDollar}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">Recently Added</h2>
          </div>
          {stats?.recentProducts?.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No products yet.{" "}
              <Link to="/products" className="text-blue-600 hover:underline">
                Add one
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats?.recentProducts?.map((p) => (
                <li key={p._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.productName}
                    </p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <span className="text-sm text-gray-600">
                    Qty: {p.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">⚠ Needs Restocking</h2>
          </div>
          {stats?.lowStockProducts?.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              All products are well stocked!
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats?.lowStockProducts?.slice(0, 5).map((p) => (
                <li key={p._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.productName}
                    </p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <span className="badge-low-stock">
                    ⚠ {p.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
