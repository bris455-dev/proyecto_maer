// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const user = JSON.parse(localStorage.getItem("user_data") || '{}');
  const token = localStorage.getItem("auth_token");

  // No autenticado
  if (!token || !user?.rol) {
    return <Navigate to="/" replace />;
  }

  // Validar rol
  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}
