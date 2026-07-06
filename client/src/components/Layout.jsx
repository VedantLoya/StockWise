import Sidebar from "./Sidebar";

// Layout wraps every authenticated page with the sidebar
const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
