import React from "react";
import { useNavigate } from "react-router-dom";
// 🔹 Importar useAuth desde hooks, no desde context
import { useAuth } from "../hooks/useAuth.js"; 
// Asume que tienes un archivo de API para el cierre de sesión en el servidor
import { logoutUser } from "../api/auth.js"; // 🔹 agregar extensión .js

function LogoutButton() { 
  const navigate = useNavigate();
  // 🔑 Obtener la función de logout del Hook
  const { logout } = useAuth(); 

  const handleLogout = async () => {
    try {
      // 1. Notificar al servidor (opcional)
      await logoutUser();
      console.log("Logout de servidor exitoso.");
    } catch (err) {
      // 2. Si falla, forzar el logout local
      console.error("Error al cerrar sesión (Server). Forzando logout local.", err);
    } 
    
    // 3. 🔑 Limpiar el estado global via Context y localStorage
    logout();
    
    // 4. Navegar al login
    navigate("/", { replace: true });
  };

  return (
    <button onClick={handleLogout} className="btn-logout">
      Cerrar sesión
    </button>
  );
}

export default LogoutButton;
