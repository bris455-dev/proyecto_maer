import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute({ children, requiredPermission }) {
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un permiso específico, verificar
  if (requiredPermission) {
    const [modulo, submodulo] = requiredPermission.split(',');
    if (!hasPermission(modulo.trim(), submodulo?.trim())) {
      return <Navigate to="/inicio" replace />;
    }
  }

  return children;
}

