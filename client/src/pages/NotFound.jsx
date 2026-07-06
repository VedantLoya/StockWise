import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mt-4">Page not found</h1>
      <p className="text-gray-500 mt-2 mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
