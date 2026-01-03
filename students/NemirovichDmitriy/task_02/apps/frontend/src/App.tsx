import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context";
import { Layout, ProtectedRoute } from "./components";
import {
  LoginPage,
  RegisterPage,
  TripsListPage,
  TripCreatePage,
  TripEditPage,
  TripDetailPage,
} from "./pages";
import "./styles/global.css";

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/trips" element={<TripsListPage />} />
              <Route path="/trips/new" element={<TripCreatePage />} />
              <Route path="/trips/:tripId" element={<TripDetailPage />} />
              <Route path="/trips/:tripId/edit" element={<TripEditPage />} />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/trips" replace />} />
          <Route path="*" element={<Navigate to="/trips" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
