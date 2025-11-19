import React, { useState, useMemo, useCallback } from "react";
import { MenuContext } from "./MenuContext.jsx";

export const MenuProvider = ({ children }) => {
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [mostrarSubmenu, setMostrarSubmenu] = useState(null);

  const toggleMenu = useCallback(() => setMenuAbierto(prev => !prev), []);
  const toggleSubmenu = useCallback(nombreModulo => {
    setMostrarSubmenu(prev => (prev === nombreModulo ? null : nombreModulo));
  }, []);

  const contextValue = useMemo(() => ({
    menuAbierto,
    mostrarSubmenu,
    toggleMenu,
    toggleSubmenu,
    setMenuAbierto,
    setMostrarSubmenu
  }), [menuAbierto, mostrarSubmenu, toggleMenu, toggleSubmenu]);

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
};
