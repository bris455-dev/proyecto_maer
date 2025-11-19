import { useContext } from "react";
import { MenuContext } from "../context/MenuContext.jsx";

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu debe usarse dentro de un MenuProvider");
  return context;
};
