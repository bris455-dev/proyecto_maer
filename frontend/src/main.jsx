import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { MenuProvider } from "./context/MenuProvider.jsx";
import { inicializarTema } from "./utils/themeManager.js";
import { inicializarIdioma } from "./utils/i18n.js";
import "./styles/theme.css";

// Inicializar tema e idioma al cargar la aplicación
inicializarTema();
inicializarIdioma();

// Suprimir errores de MetaMask y otras extensiones de wallet que no son necesarias
// Estos errores provienen de extensiones del navegador y no afectan la funcionalidad de la app
window.addEventListener('error', (event) => {
  // Suprimir errores relacionados con MetaMask si la extensión no está instalada
  if (
    event.message?.includes('MetaMask') ||
    event.message?.includes('metamask') ||
    event.message?.includes('Failed to connect to MetaMask') ||
    event.message?.includes('MetaMask extension not found') ||
    event.error?.message?.includes('MetaMask') ||
    event.error?.message?.includes('metamask')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Suprimir promesas rechazadas relacionadas con MetaMask
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason?.toString() || '';
  if (
    reason.includes('MetaMask') ||
    reason.includes('metamask') ||
    reason.includes('Failed to connect to MetaMask') ||
    reason.includes('MetaMask extension not found')
  ) {
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      
      <MenuProvider>
        <App />
      </MenuProvider>
    </AuthProvider>
  </React.StrictMode>
);
