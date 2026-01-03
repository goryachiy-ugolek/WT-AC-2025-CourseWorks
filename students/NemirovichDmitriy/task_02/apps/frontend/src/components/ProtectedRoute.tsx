import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
