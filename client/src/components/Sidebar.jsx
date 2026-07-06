import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { to: "/products", label: "Products", icon: HiOutlineCube },
  { to: "/low-stock", label: "Low Stock", icon: HiOutlineExclamationTriangle },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SW</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">StockWise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
