import React, { createContext, useState, useContext } from "react";

const MenuContext = createContext();

export function MenuProvider({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [mostrarSubmenu, setMostrarSubmenu] = useState(null); // ahora guarda el nombre del submenú

  return (
    <MenuContext.Provider
      value={{
        menuAbierto,
        setMenuAbierto,
        mostrarSubmenu,
        setMostrarSubmenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}

